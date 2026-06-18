import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { CheckoutFormSchema } from '@/lib/validations/order'
import { orderOrchestrator } from '@/lib/order-orchestrator'
import { applyPromoCode } from '@/lib/utils/price'
import { calculateShipping } from '@/lib/utils/price'
import type { Prisma, PaymentMethod } from '@prisma/client'

function generateOrderNumber(): string {
  return `DD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

interface CheckoutItem {
  productId: string
  variantId?: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsed = CheckoutFormSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const items = (body.items as CheckoutItem[] | undefined) ?? []

    if (!items.length) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    // Load products and check stock
    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
      select: { id: true, nameFr: true, images: true, priceMad: true, stock: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Un ou plusieurs produits sont indisponibles' }, { status: 400 })
    }

    const stockErrors: string[] = []
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      if (product.stock < item.quantity) {
        stockErrors.push(`${product.nameFr} : stock insuffisant`)
      }
    }
    if (stockErrors.length) {
      return NextResponse.json({ error: stockErrors.join(', ') }, { status: 400 })
    }

    // Calculate subtotal
    const subtotalMad = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + Number(product?.priceMad ?? 0) * item.quantity
    }, 0)

    // Apply promo code
    let discountMad = 0
    let shippingIsFree = false
    if (data.promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: data.promoCode.toUpperCase() } })
      if (promo) {
        const result = applyPromoCode(subtotalMad, promo)
        discountMad = result.discount
        if (promo.type === 'FREE_SHIPPING') shippingIsFree = true
      }
    }

    // Calculate shipping
    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: {
        countries: { has: data.shippingAddress.country },
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    let shippingCostMad = 0
    if (!shippingIsFree && shippingMethod) {
      shippingCostMad = calculateShipping(data.shippingAddress.country, subtotalMad, {
        id: shippingMethod.id,
        priceMad: Number(shippingMethod.priceMad),
        priceEur: shippingMethod.priceEur ? Number(shippingMethod.priceEur) : null,
        freeThresholdMad: shippingMethod.freeThresholdMad ? Number(shippingMethod.freeThresholdMad) : null,
      })
    }

    const totalMad = subtotalMad - discountMad + shippingCostMad

    // Resolve customer
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let customerId: string | null = null
    if (user) {
      const customer = await prisma.customer.findUnique({ where: { authUserId: user.id }, select: { id: true } })
      customerId = customer?.id ?? null
    }

    // Snapshot items for the order JSON field
    const itemsSnapshot = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        name: product.nameFr,
        image: product.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: Number(product.priceMad),
        totalMad: Number(product.priceMad) * item.quantity,
      }
    })

    // Build OrderItem create data
    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        productName: product.nameFr,
        productImage: product.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: Number(product.priceMad),
        totalMad: Number(product.priceMad) * item.quantity,
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress as unknown as Prisma.InputJsonValue,
        items: itemsSnapshot as unknown as Prisma.InputJsonValue,
        subtotalMad,
        shippingCostMad,
        discountMad,
        totalMad,
        currency: 'MAD',
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'NEW',
        source: 'SHOP',
        promoCode: data.promoCode ?? null,
        notes: data.notes ?? null,
        orderItems: { createMany: { data: orderItemsData } },
      },
    })

    // Update promo code usage
    if (data.promoCode) {
      await prisma.promoCode.updateMany({
        where: { code: data.promoCode.toUpperCase() },
        data: { currentUses: { increment: 1 } },
      })
    }

    // Trigger orchestrator asynchronously for STRIPE/PAYPAL (COD handled separately)
    if (data.paymentMethod !== 'COD' && data.paymentMethod !== 'CMI') {
      orderOrchestrator.processOrder(order.id).catch((err) => {
        console.error(`[POST /api/orders] Orchestrator error for ${order.id}:`, err)
      })
    }

    return NextResponse.json(
      { orderId: order.id, orderNumber: order.orderNumber },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { authUserId: user.id },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ orders: [], total: 0 })
    }

    const page = Number(request.nextUrl.searchParams.get('page') ?? 1)
    const limit = 10

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, orderNumber: true, orderStatus: true, paymentStatus: true,
          totalMad: true, currency: true, trackingNumber: true, createdAt: true,
          orderItems: {
            select: { productName: true, productImage: true, quantity: true, unitPriceMad: true },
          },
        },
      }),
      prisma.order.count({ where: { customerId: customer.id } }),
    ])

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
