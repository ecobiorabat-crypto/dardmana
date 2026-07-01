import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CODFormSchema } from '@/lib/validations/order'
import { orderOrchestrator } from '@/lib/order-orchestrator'
import { findOrCreateCustomerByPhone } from '@/lib/customer'
import { calculateShipping, applyPromoCode } from '@/lib/utils/price'
import type { Prisma } from '@prisma/client'

function generateOrderNumber(): string {
  return `DD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

interface CODItem {
  productId: string
  quantity: number
  variantId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[COD] Body reçu:', JSON.stringify(body))
    const parsed = CODFormSchema.safeParse(body)

    if (!parsed.success) {
      console.log('[COD] Erreur Zod:', JSON.stringify(parsed.error.flatten()))
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const items = (body.items as CODItem[] | undefined) ?? []

    if (!items.length) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    // Validate products and stock
    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
      select: { id: true, nameFr: true, images: true, priceMad: true, stock: true },
    })

    const stockErrors: string[] = []
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) { stockErrors.push(`Produit ${item.productId} indisponible`); continue }
      if (product.stock < item.quantity) stockErrors.push(`${product.nameFr} : stock insuffisant`)
    }
    if (stockErrors.length) {
      return NextResponse.json({ error: stockErrors.join(', ') }, { status: 400 })
    }

    const subtotalMad = items.reduce((sum, item) => {
      const p = products.find((pr) => pr.id === item.productId)
      return sum + Number(p?.priceMad ?? 0) * item.quantity
    }, 0)

    // Code promo (transmis depuis le panier) — réduction recalculée côté serveur.
    let discountMad = 0
    let shippingIsFree = false
    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim() : undefined
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode.toUpperCase() } })
      if (promo) {
        const result = applyPromoCode(subtotalMad, promo)
        if (!result.error) {
          discountMad = result.discount
          if (promo.type === 'FREE_SHIPPING') shippingIsFree = true
        }
      }
    }

    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: { countries: { has: 'MA' }, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    const shippingCostMad = shippingIsFree
      ? 0
      : shippingMethod
        ? calculateShipping('MA', subtotalMad, {
            id: shippingMethod.id,
            priceMad: Number(shippingMethod.priceMad),
            priceEur: null,
            freeThresholdMad: shippingMethod.freeThresholdMad ? Number(shippingMethod.freeThresholdMad) : null,
          })
        : 35

    const totalMad = Math.max(0, subtotalMad - discountMad) + shippingCostMad

    const itemsSnapshot = items.map((item) => {
      const p = products.find((pr) => pr.id === item.productId)!
      return {
        productId: item.productId,
        name: p.nameFr,
        image: p.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: Number(p.priceMad),
        totalMad: Number(p.priceMad) * item.quantity,
      }
    })

    const shippingAddress = {
      fullName: data.customerName,
      phone: data.customerPhone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      postalCode: data.postalCode ?? null,
      region: data.region ?? null,
      country: 'MA',
    }

    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = items.map((item) => {
      const p = products.find((pr) => pr.id === item.productId)!
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        productName: p.nameFr,
        productImage: p.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: Number(p.priceMad),
        totalMad: Number(p.priceMad) * item.quantity,
      }
    })

    // Lie ou crée le Customer par téléphone (comme /api/admin/orders).
    const customerId = await findOrCreateCustomerByPhone(prisma, {
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail || null,
      country: 'MA',
      totalMad,
      addressLine1: data.addressLine1,
      city: data.city,
    }).catch((err) => {
      console.error('[COD] Liaison Customer échouée (non bloquant):', err)
      return null
    })

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail ?? `cod-${Date.now()}@dardmana.internal`,
        customerPhone: data.customerPhone,
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        items: itemsSnapshot as unknown as Prisma.InputJsonValue,
        subtotalMad,
        shippingCostMad,
        discountMad,
        totalMad,
        currency: 'MAD',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'NEW',
        source: 'SHOP',
        promoCode: promoCode ? promoCode.toUpperCase() : null,
        notes: data.notes ?? null,
        orderItems: { createMany: { data: orderItemsData } },
      },
    })

    // Incrémente l'usage du code promo si réduction appliquée.
    if (promoCode && discountMad > 0) {
      await prisma.promoCode.updateMany({
        where: { code: promoCode.toUpperCase() },
        data: { currentUses: { increment: 1 } },
      })
    }

    // Trigger orchestrator for COD (no payment needed, go straight to processing)
    orderOrchestrator.processOrder(order.id).catch((err) => {
      console.error(`[POST /api/checkout/cod] Orchestrator error for ${order.id}:`, err)
    })

    return NextResponse.json({ orderNumber: order.orderNumber, orderId: order.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/checkout/cod]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
