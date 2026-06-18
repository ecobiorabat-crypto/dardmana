import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { abandonedCartReminder } from '@/lib/resend'
import type { AbandonedCart } from '@prisma/client'

export const dynamic = 'force-dynamic'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const HOUR = 60 * 60 * 1000
const RECOVERY_PROMO = 'RETOUR10'
const RECOVERY_PROMO_PERCENT = 10

interface CartItemSnapshot {
  name: string
  image?: string
  priceMad: number
  quantity: number
}

async function emailCart(cart: AbandonedCart, promoCode?: string): Promise<void> {
  if (!cart.email) return // SMS non implémenté : on n'envoie que par email pour l'instant
  const items = (Array.isArray(cart.items) ? cart.items : []) as unknown as CartItemSnapshot[]
  await abandonedCartReminder({
    customerName: cart.customerName,
    email: cart.email,
    items: items.map((i) => ({
      name: i.name,
      image: i.image ?? '',
      quantity: i.quantity,
      unitPriceMad: i.priceMad,
    })),
    totalMad: Number(cart.totalMad),
    recoverUrl: `${APP_URL}/fr/panier`,
    promoCode,
    promoPercent: promoCode ? RECOVERY_PROMO_PERCENT : undefined,
  }).catch((err) => console.error('[cron/abandoned-cart] email échoué:', err))
}

export async function GET(request: NextRequest) {
  // Sécurité : Vercel Cron envoie `Authorization: Bearer ${CRON_SECRET}`.
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const headerSecret = request.headers.get('x-cron-secret')
  if (!secret || (auth !== `Bearer ${secret}` && headerSecret !== secret)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const now = Date.now()
    const firstFrom = new Date(now - 2 * HOUR)
    const firstTo = new Date(now - 1 * HOUR)
    const secondFrom = new Date(now - 25 * HOUR)
    const secondTo = new Date(now - 24 * HOUR)
    const expireBefore = new Date(now - 7 * 24 * HOUR)

    // 1. Première relance : créés il y a 1h–2h, aucune relance encore.
    const firstBatch = await prisma.abandonedCart.findMany({
      where: { status: 'ACTIVE', remindersSent: 0, createdAt: { gte: firstFrom, lte: firstTo } },
    })
    for (const cart of firstBatch) {
      await emailCart(cart)
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { remindersSent: 1, lastReminderAt: new Date() },
      })
    }

    // 2. Seconde relance : créés il y a 24h–25h, une relance déjà envoyée → code promo.
    const secondBatch = await prisma.abandonedCart.findMany({
      where: { status: 'ACTIVE', remindersSent: 1, createdAt: { gte: secondFrom, lte: secondTo } },
    })
    if (secondBatch.length > 0) {
      // Garantit l'existence du code promo incitatif.
      await prisma.promoCode.upsert({
        where: { code: RECOVERY_PROMO },
        update: { isActive: true },
        create: {
          code: RECOVERY_PROMO,
          type: 'PERCENT',
          value: RECOVERY_PROMO_PERCENT,
          minOrderMad: 0,
          maxUses: null,
          isActive: true,
        },
      })
    }
    for (const cart of secondBatch) {
      await emailCart(cart, RECOVERY_PROMO)
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { remindersSent: 2, lastReminderAt: new Date() },
      })
    }

    // 3. Expiration : aucun achat après 7 jours.
    const expired = await prisma.abandonedCart.updateMany({
      where: { status: 'ACTIVE', createdAt: { lt: expireBefore } },
      data: { status: 'EXPIRED' },
    })

    return NextResponse.json({
      success: true,
      firstReminders: firstBatch.length,
      secondReminders: secondBatch.length,
      expired: expired.count,
    })
  } catch (error) {
    console.error('[GET /api/cron/abandoned-cart-reminders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
