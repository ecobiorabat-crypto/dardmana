import { prisma } from '@/lib/prisma'
import { confirmOrder, orderShipped, resend, type EmailOrder, type PersonalPromo } from '@/lib/resend'
import { OrderStatus, PromoType } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import type { DeliveryPayload, DeliveryProvider } from '@/lib/delivery/types'
import { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'
import { createDeliveryProvider } from '@/lib/delivery/factory'
import { getDeliverySettings } from '@/lib/delivery/settings'
import { notifyAdminWhatsApp } from '@/lib/notify-whatsapp'

// Ré-exports pour compatibilité avec les imports existants éventuels.
export type {
  DeliveryProvider,
  DeliveryPayload,
  DeliveryResult,
  TrackingEventData,
} from '@/lib/delivery/types'
export { ManualDeliveryProvider } from '@/lib/delivery/providers/manual'
export { AmanaDeliveryProvider } from '@/lib/delivery/providers/amana'
export { CTMDeliveryProvider } from '@/lib/delivery/providers/ctm'

/** Suffixe aléatoire lisible (sans caractères ambigus) pour les codes promo. */
function randomSuffix(len: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// ─── Prisma payload type for order with items ──────────────────────────────────

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: { product: true }
    }
  }
}>

// ─── Stored address type (matches shippingAddress Json field in DB) ───────────

interface StoredAddress {
  fullName?: string
  addressLine1?: string
  city?: string
  country?: string
}

// Les providers vivent désormais dans lib/delivery/providers/* (voir imports).

// ─── Order Orchestrator ───────────────────────────────────────────────────────

export class OrderOrchestrator {
  // Provider injecté (tests / usage explicite). Si absent, il est résolu
  // dynamiquement depuis DeliverySettings (transporteur actif choisi en admin).
  private injected?: DeliveryProvider

  constructor(provider?: DeliveryProvider) {
    this.injected = provider
  }

  /** Résout le transporteur actif (injecté, ou configuré en base, sinon manuel). */
  private async resolveProvider(): Promise<DeliveryProvider> {
    if (this.injected) return this.injected
    try {
      const settings = await getDeliverySettings()
      return createDeliveryProvider(settings.activeProvider, {
        amanaApiKey: settings.amanaApiKey || undefined,
        ctmApiKey: settings.ctmApiKey || undefined,
      })
    } catch {
      return new ManualDeliveryProvider()
    }
  }

  async processOrder(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { product: true } } },
    })

    if (!order) throw new Error(`Commande introuvable : ${orderId}`)

    // 1. Vérifier le stock disponible
    const stockIssues: string[] = []
    for (const item of order.orderItems) {
      if (!item.product) continue
      if (item.product.stock < item.quantity) {
        stockIssues.push(
          `${item.productName}: stock ${item.product.stock} < demandé ${item.quantity}`
        )
      }
    }
    if (stockIssues.length > 0) {
      const err = new Error(`Stock insuffisant : ${stockIssues.join('; ')}`)
      await this.alertAdmin(orderId, err)
      throw err
    }

    try {
      // 1b. Panier abandonné : marque comme récupéré (commande finalisée avec succès).
      await this.markCartRecovered(order)

      // 1c. Notification WhatsApp admin (nouvelle commande) — non bloquant.
      await notifyAdminWhatsApp({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalMad: Number(order.totalMad),
        paymentMethod: order.paymentMethod,
        source: order.source,
        orderItems: order.orderItems.map((it) => ({ productName: it.productName, quantity: it.quantity })),
      }).catch((err) => console.error('[Orchestrator] Notif WhatsApp admin échouée (non bloquant):', err))

      // 2. Réserver le stock
      for (const item of order.orderItems) {
        if (!item.productId) continue
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        })
      }

      // 2b. Fidélité : incrémente les compteurs client. Si c'est la 1ère
      //     commande (totalOrders === 1 après incrémentation), génère un code
      //     promo personnel à usage unique (-10 %, valable 30 jours).
      let personalPromo: PersonalPromo | undefined
      if (order.customerId) {
        const customer = await prisma.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpentMad: { increment: order.totalMad },
          },
        })
        if (customer.totalOrders === 1) {
          personalPromo = await this.createFirstOrderPromo().catch((err) => {
            console.error('[Orchestrator] Génération promo 1ère commande échouée:', err)
            return undefined
          })
        }
      }

      // 3. Email confirmation client (inclut le code promo si applicable).
      //    Non bloquant : un échec d'email (ex. RESEND_API_KEY absent) ne doit
      //    PAS annuler la commande ni le stock réservé.
      await confirmOrder(this.buildEmailOrder(order), personalPromo).catch((err) =>
        console.error('[Orchestrator] Email de confirmation échoué (non bloquant):', err),
      )

      // 4. Créer l'expédition via le transporteur actif
      const provider = await this.resolveProvider()
      const deliveryPayload = this.buildDeliveryPayload(order)
      const { trackingNumber } = await provider.createShipment(deliveryPayload)

      // 5. Mettre à jour la commande
      await prisma.order.update({
        where: { id: orderId },
        data: {
          trackingNumber,
          carrier: provider.name,
          orderStatus: OrderStatus.PROCESSING,
        },
      })

      // 6. Historique de statut
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PROCESSING,
          note: `Expédition ${provider.name} — tracking : ${trackingNumber}`,
          changedBy: 'system',
        },
      })

      // 7. Email "en préparation" — non bloquant également.
      await orderShipped(this.buildEmailOrder(order), trackingNumber).catch((err) =>
        console.error('[Orchestrator] Email d\'expédition échoué (non bloquant):', err),
      )

    } catch (error) {
      await this.rollbackStock(order.orderItems)
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryError: error instanceof Error ? error.message : 'Erreur inconnue' },
      })
      await this.alertAdmin(orderId, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /** Crée un code promo personnel "MERCI-XXXXX" (-10 %, 30 jours, usage unique). */
  private async createFirstOrderPromo(): Promise<PersonalPromo> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const discountPercent = 10

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `MERCI-${randomSuffix(5)}`
      try {
        await prisma.promoCode.create({
          data: {
            code,
            type: PromoType.PERCENT,
            value: discountPercent,
            minOrderMad: 0,
            maxUses: 1,
            expiresAt,
            isActive: true,
          },
        })
        return { code, discountPercent, expiresAt }
      } catch (err) {
        // P2002 = collision du code unique → on régénère
        if (typeof err === 'object' && err && 'code' in err && err.code === 'P2002') continue
        throw err
      }
    }
    throw new Error('Impossible de générer un code promo unique après 5 tentatives')
  }

  /** Marque les paniers abandonnés ACTIVE de ce client comme RECOVERED. */
  private async markCartRecovered(order: OrderWithItems): Promise<void> {
    const or: Prisma.AbandonedCartWhereInput[] = []
    if (order.customerEmail && !order.customerEmail.endsWith('@dardmana.internal')) {
      or.push({ email: order.customerEmail })
    }
    if (order.customerPhone) or.push({ phone: order.customerPhone })
    if (or.length === 0) return
    await prisma.abandonedCart
      .updateMany({ where: { status: 'ACTIVE', OR: or }, data: { status: 'RECOVERED' } })
      .catch((err) => console.error('[Orchestrator] markCartRecovered:', err))
  }

  buildDeliveryPayload(order: OrderWithItems): DeliveryPayload {
    const addr = order.shippingAddress as StoredAddress | null
    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: addr?.addressLine1 ?? '',
      city: addr?.city ?? '',
      country: addr?.country ?? 'MA',
      items: order.orderItems.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceMad),
      })),
      totalMad: Number(order.totalMad),
      paymentMethod: order.paymentMethod,
      notes: order.notes ?? undefined,
    }
  }

  async rollbackStock(
    items: { productId: string | null; quantity: number }[]
  ): Promise<void> {
    for (const item of items) {
      if (!item.productId) continue
      await prisma.product
        .update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } },
        })
        .catch((err) => {
          console.error(`[Orchestrator] Rollback stock échoué pour ${item.productId}:`, err)
        })
    }
  }

  async alertAdmin(orderId: string, error: Error): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@dardmana.ma'
    console.error(`[Orchestrator] ALERTE commande ${orderId}:`, error.message)
    await resend.emails
      .send({
        from: 'Dar Dmana System <no-reply@dardmana.ma>',
        to: [adminEmail],
        subject: `⚠️ Erreur commande ${orderId}`,
        html: `<p>Erreur commande <strong>${orderId}</strong>:</p><pre>${error.message}\n\n${error.stack ?? ''}</pre>`,
      })
      .catch((err) => {
        console.error('[Orchestrator] Alerte admin impossible:', err)
      })
  }

  private buildEmailOrder(order: OrderWithItems): EmailOrder {
    const addr = order.shippingAddress as StoredAddress | null
    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.orderItems.map((item) => ({
        name: item.productName,
        image: item.productImage,
        quantity: item.quantity,
        unitPriceMad: Number(item.unitPriceMad),
      })),
      subtotalMad: Number(order.subtotalMad),
      shippingCostMad: Number(order.shippingCostMad),
      discountMad: Number(order.discountMad),
      totalMad: Number(order.totalMad),
      shippingAddress: {
        fullName: addr?.fullName ?? order.customerName,
        addressLine1: addr?.addressLine1 ?? '',
        city: addr?.city ?? '',
        country: addr?.country ?? 'MA',
      },
      paymentMethod: order.paymentMethod,
    }
  }
}

export const orderOrchestrator = new OrderOrchestrator()
