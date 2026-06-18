'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth/admin-guard'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { orderOrchestrator } from '@/lib/order-orchestrator'
import { ProductSchema } from '@/lib/validations/product'
import type { Prisma, OrderStatus, ProductStatus, ProductType, PromoType } from '@prisma/client'

export interface ActionResult {
  ok: boolean
  error?: string
  message?: string
  id?: string
}

async function guard(permission: Permission): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const session = await getAdminSession()
  if (!session) return { ok: false, error: 'Session expirée, reconnectez-vous.' }
  if (!hasPermission(session.role, permission)) return { ok: false, error: 'Permission refusée.' }
  return { ok: true, email: session.adminEmail }
}

// ─── Commandes ──────────────────────────────────────────────────────────────

export async function updateOrderAction(input: {
  id: string
  orderStatus?: string
  adminNotes?: string
  trackingNumber?: string
  carrier?: string
}): Promise<ActionResult> {
  const g = await guard('orders.update')
  if (!g.ok) return g

  try {
    const existing = await prisma.order.findUnique({
      where: { id: input.id },
      select: { id: true, orderStatus: true },
    })
    if (!existing) return { ok: false, error: 'Commande introuvable' }

    await prisma.order.update({
      where: { id: input.id },
      data: {
        ...(input.orderStatus && { orderStatus: input.orderStatus as OrderStatus }),
        ...(input.adminNotes !== undefined && { adminNotes: input.adminNotes }),
        ...(input.trackingNumber !== undefined && { trackingNumber: input.trackingNumber }),
        ...(input.carrier !== undefined && { carrier: input.carrier }),
      },
    })

    if (input.orderStatus && input.orderStatus !== existing.orderStatus) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: input.id,
          status: input.orderStatus as OrderStatus,
          changedBy: g.email,
          note: input.adminNotes ?? null,
        },
      })
    }

    revalidatePath(`/admin/commandes/${input.id}`)
    revalidatePath('/admin/commandes')
    revalidatePath('/admin/operations')
    return { ok: true, message: 'Commande mise à jour' }
  } catch (e) {
    console.error('[updateOrderAction]', e)
    return { ok: false, error: 'Erreur lors de la mise à jour' }
  }
}

export async function cancelOrderAction(id: string): Promise<ActionResult> {
  const g = await guard('orders.cancel')
  if (!g.ok) return g

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: { select: { productId: true, quantity: true } } },
    })
    if (!order) return { ok: false, error: 'Commande introuvable' }
    if (['DELIVERED', 'REFUNDED'].includes(order.orderStatus)) {
      return { ok: false, error: 'Impossible d\u2019annuler une commande livrée ou remboursée' }
    }

    await orderOrchestrator.rollbackStock(order.orderItems)
    await prisma.order.update({ where: { id }, data: { orderStatus: 'CANCELLED' } })
    await prisma.orderStatusHistory.create({
      data: { orderId: id, status: 'CANCELLED', changedBy: g.email, note: 'Annulée par admin' },
    })

    revalidatePath(`/admin/commandes/${id}`)
    revalidatePath('/admin/commandes')
    return { ok: true, message: 'Commande annulée, stock rétabli' }
  } catch (e) {
    console.error('[cancelOrderAction]', e)
    return { ok: false, error: 'Erreur lors de l\u2019annulation' }
  }
}

export async function refundOrderAction(id: string): Promise<ActionResult> {
  const g = await guard('payments.refund')
  if (!g.ok) return g

  try {
    await prisma.order.update({
      where: { id },
      data: { orderStatus: 'REFUNDED', paymentStatus: 'REFUNDED' },
    })
    await prisma.orderStatusHistory.create({
      data: { orderId: id, status: 'REFUNDED', changedBy: g.email, note: 'Remboursée par admin' },
    })
    revalidatePath(`/admin/commandes/${id}`)
    return { ok: true, message: 'Commande remboursée' }
  } catch (e) {
    console.error('[refundOrderAction]', e)
    return { ok: false, error: 'Erreur lors du remboursement' }
  }
}

// ─── Opérations / livraison ─────────────────────────────────────────────────

export async function retryDeliveryAction(orderId: string): Promise<ActionResult> {
  const g = await guard('operations.retry')
  if (!g.ok) return g

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) return { ok: false, error: 'Commande introuvable' }

    await prisma.order.update({ where: { id: orderId }, data: { deliveryError: null } })
    await orderOrchestrator.processOrder(orderId)

    revalidatePath('/admin/operations')
    return { ok: true, message: 'Envoi transporteur relancé' }
  } catch (e) {
    console.error('[retryDeliveryAction]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur lors de la relance' }
  }
}

export async function markDeliveryHandledAction(orderId: string): Promise<ActionResult> {
  const g = await guard('operations.retry')
  if (!g.ok) return g

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryError: null, adminNotes: 'Traité manuellement' },
    })
    revalidatePath('/admin/operations')
    return { ok: true, message: 'Marqué comme traité manuellement' }
  } catch (e) {
    console.error('[markDeliveryHandledAction]', e)
    return { ok: false, error: 'Erreur' }
  }
}

export async function shipOrderAction(orderId: string, trackingNumber: string, carrier: string): Promise<ActionResult> {
  const g = await guard('orders.update')
  if (!g.ok) return g

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: 'SHIPPED', trackingNumber, carrier: carrier || 'Amana' },
    })
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'SHIPPED',
        changedBy: g.email,
        note: `Expédiée — suivi ${trackingNumber}`,
      },
    })
    revalidatePath('/admin/operations')
    revalidatePath('/admin/commandes')
    return { ok: true, message: 'Commande marquée expédiée' }
  } catch (e) {
    console.error('[shipOrderAction]', e)
    return { ok: false, error: 'Erreur lors de l\u2019expédition' }
  }
}

// ─── Produits ───────────────────────────────────────────────────────────────

export async function upsertProductAction(
  id: string | null,
  data: unknown,
): Promise<ActionResult> {
  const g = await guard(id ? 'products.update' : 'products.create')
  if (!g.ok) return g

  const parsed = ProductSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first ? `${first.path.join('.')} : ${first.message}` : 'Données invalides' }
  }

  const { variants, ...productData } = parsed.data

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          status: productData.status as ProductStatus,
          type: productData.type as ProductType,
        },
      })
      // Remplace les variantes
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      if (variants?.length) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            nameFr: v.nameFr,
            nameAr: v.nameAr,
            nameEn: v.nameEn,
            sku: v.sku ?? null,
            priceMad: v.priceMad,
            stock: v.stock,
            attributes: v.attributes as Prisma.InputJsonValue,
            isActive: v.isActive,
          })),
        })
      }
      revalidatePath('/admin/produits')
      revalidatePath(`/admin/produits/${id}`)
      return { ok: true, id, message: 'Produit mis à jour' }
    }

    const created = await prisma.product.create({
      data: {
        ...productData,
        status: productData.status as ProductStatus,
        type: productData.type as ProductType,
        variants: variants?.length
          ? {
              create: variants.map((v) => ({
                nameFr: v.nameFr,
                nameAr: v.nameAr,
                nameEn: v.nameEn,
                sku: v.sku ?? null,
                priceMad: v.priceMad,
                stock: v.stock,
                attributes: v.attributes as Prisma.InputJsonValue,
                isActive: v.isActive,
              })),
            }
          : undefined,
      },
    })
    revalidatePath('/admin/produits')
    return { ok: true, id: created.id, message: 'Produit créé' }
  } catch (e) {
    console.error('[upsertProductAction]', e)
    const msg = e instanceof Error && e.message.includes('Unique') ? 'Slug ou SKU déjà utilisé' : 'Erreur lors de l\u2019enregistrement'
    return { ok: false, error: msg }
  }
}

export async function archiveProductAction(id: string): Promise<ActionResult> {
  const g = await guard('products.delete')
  if (!g.ok) return g
  try {
    await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED' } })
    revalidatePath('/admin/produits')
    return { ok: true, message: 'Produit archivé' }
  } catch (e) {
    console.error('[archiveProductAction]', e)
    return { ok: false, error: 'Erreur' }
  }
}

export async function adjustStockAction(id: string, stock: number): Promise<ActionResult> {
  const g = await guard('products.update')
  if (!g.ok) return g
  if (!Number.isFinite(stock) || stock < 0) return { ok: false, error: 'Stock invalide' }
  try {
    await prisma.product.update({ where: { id }, data: { stock: Math.floor(stock) } })
    revalidatePath('/admin/stock')
    return { ok: true, message: 'Stock mis à jour' }
  } catch (e) {
    console.error('[adjustStockAction]', e)
    return { ok: false, error: 'Erreur' }
  }
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export async function upsertCouponAction(input: {
  id?: string
  code: string
  type: string
  value: number
  minOrderMad: number
  maxUses?: number | null
  expiresAt?: string | null
  isActive: boolean
}): Promise<ActionResult> {
  const g = await guard('coupons.update')
  if (!g.ok) return g

  if (!input.code.trim()) return { ok: false, error: 'Code requis' }

  const data = {
    code: input.code.trim().toUpperCase(),
    type: input.type as PromoType,
    value: input.value,
    minOrderMad: input.minOrderMad,
    maxUses: input.maxUses ?? null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    isActive: input.isActive,
  }

  try {
    if (input.id) {
      await prisma.promoCode.update({ where: { id: input.id }, data })
    } else {
      await prisma.promoCode.create({ data })
    }
    revalidatePath('/admin/coupons')
    return { ok: true, message: 'Coupon enregistré' }
  } catch (e) {
    console.error('[upsertCouponAction]', e)
    const msg = e instanceof Error && e.message.includes('Unique') ? 'Ce code existe déjà' : 'Erreur'
    return { ok: false, error: msg }
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  const g = await guard('coupons.delete')
  if (!g.ok) return g
  try {
    await prisma.promoCode.delete({ where: { id } })
    revalidatePath('/admin/coupons')
    return { ok: true, message: 'Coupon supprimé' }
  } catch (e) {
    console.error('[deleteCouponAction]', e)
    return { ok: false, error: 'Erreur' }
  }
}

// ─── Livraison (ShippingMethod) ──────────────────────────────────────────────

export async function updateShippingMethodAction(input: {
  id: string
  priceMad: number
  freeThresholdMad?: number | null
  isActive: boolean
}): Promise<ActionResult> {
  const g = await guard('orders.update')
  if (!g.ok) return g
  try {
    await prisma.shippingMethod.update({
      where: { id: input.id },
      data: {
        priceMad: input.priceMad,
        freeThresholdMad: input.freeThresholdMad ?? null,
        isActive: input.isActive,
      },
    })
    revalidatePath('/admin/parametres')
    return { ok: true, message: 'Méthode de livraison mise à jour' }
  } catch (e) {
    console.error('[updateShippingMethodAction]', e)
    return { ok: false, error: 'Erreur' }
  }
}
