import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { normalizePhone } from '@/lib/utils/phone'
import { notifyAdminWhatsApp } from '@/lib/notify-whatsapp'
import type { Prisma, OrderStatus, PaymentMethod, PaymentStatus, OrderSource } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const params = request.nextUrl.searchParams
    const page = Number(params.get('page') ?? 1)
    const limit = 20
    const status = params.get('status') as OrderStatus | null
    const search = params.get('search')?.trim()
    const dateFrom = params.get('dateFrom')
    const dateTo = params.get('dateTo')

    const where: Prisma.OrderWhereInput = {
      ...(status && { orderStatus: status }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' as const } },
          { customerName: { contains: search, mode: 'insensitive' as const } },
          { customerEmail: { contains: search, mode: 'insensitive' as const } },
          { customerPhone: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, orderNumber: true,
          customerName: true, customerEmail: true, customerPhone: true,
          totalMad: true, currency: true,
          orderStatus: true, paymentStatus: true, paymentMethod: true,
          source: true, trackingNumber: true,
          createdAt: true, updatedAt: true,
          _count: { select: { orderItems: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[GET /api/admin/orders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST : création manuelle d'une commande (admin) ────────────────────────────

const NewOrderSchema = z.object({
  customer: z.object({
    phone: z.string().trim().min(6, 'Téléphone requis'),
    name: z.string().trim().min(1, 'Nom requis').max(120),
    email: z.string().trim().email().or(z.literal('')).optional(),
    addressLine1: z.string().trim().max(300).optional().default(''),
    city: z.string().trim().max(120).optional().default(''),
    country: z.string().trim().min(2).max(2).optional().default('MA'),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPriceMad: z.number().min(0),
      }),
    )
    .min(1, 'Au moins un produit'),
  paymentMethod: z.enum(['COD', 'CMI', 'STRIPE', 'WHATSAPP']),
  orderStatus: z.enum(['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  source: z.enum(['SHOP', 'WHATSAPP', 'ADMIN']).default('ADMIN'),
  orderDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
})

function generateOrderNumber(): string {
  return `DD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'orders.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const parsed = NewOrderSchema.safeParse(await request.json())
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first ? `${first.path.join('.')} : ${first.message}` : 'Données invalides' },
        { status: 400 },
      )
    }
    const data = parsed.data

    const phone = normalizePhone(data.customer.phone)
    if (!phone) return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })

    const country = (data.customer.country || 'MA').toUpperCase()
    const email = data.customer.email?.trim() || null

    // Valide les produits et le stock disponible.
    const productIds = [...new Set(data.items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nameFr: true, images: true, stock: true },
    })

    const stockErrors: string[] = []
    for (const item of data.items) {
      const p = products.find((pr) => pr.id === item.productId)
      if (!p) { stockErrors.push(`Produit ${item.productId} introuvable`); continue }
      if (p.stock < item.quantity) stockErrors.push(`${p.nameFr} : stock insuffisant (${p.stock})`)
    }
    if (stockErrors.length) {
      return NextResponse.json({ error: stockErrors.join(' · ') }, { status: 400 })
    }

    const subtotalMad = data.items.reduce((sum, i) => sum + i.unitPriceMad * i.quantity, 0)
    const totalMad = subtotalMad

    const itemsSnapshot = data.items.map((item) => {
      const p = products.find((pr) => pr.id === item.productId)!
      return {
        productId: item.productId,
        name: p.nameFr,
        image: p.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: item.unitPriceMad,
        totalMad: item.unitPriceMad * item.quantity,
      }
    })

    const shippingAddress = {
      fullName: data.customer.name,
      phone,
      addressLine1: data.customer.addressLine1 || '(à compléter)',
      city: data.customer.city || '',
      country,
    }

    const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = data.items.map((item) => {
      const p = products.find((pr) => pr.id === item.productId)!
      return {
        productId: item.productId,
        productName: p.nameFr,
        productImage: p.images[0] ?? '',
        quantity: item.quantity,
        unitPriceMad: item.unitPriceMad,
        totalMad: item.unitPriceMad * item.quantity,
      }
    })

    const orderDate = data.orderDate ? new Date(data.orderDate) : new Date()
    const paymentStatus: PaymentStatus = data.orderStatus === 'DELIVERED' ? 'PAID' : 'PENDING'

    const result = await prisma.$transaction(async (tx) => {
      // 1. Client : lié par téléphone, sinon créé.
      const existing = await tx.customer.findUnique({ where: { phone }, select: { id: true } })
      let customerId: string
      if (existing) {
        customerId = existing.id
        await tx.customer.update({
          where: { id: existing.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpentMad: { increment: totalMad },
            ...(email && { email }),
          },
        })
      } else {
        const created = await tx.customer.create({
          data: {
            name: data.customer.name,
            phone,
            email,
            country,
            totalOrders: 1,
            totalSpentMad: totalMad,
            ...(data.customer.addressLine1 && {
              addresses: {
                create: {
                  label: 'Livraison',
                  fullName: data.customer.name,
                  phone,
                  addressLine1: data.customer.addressLine1,
                  city: data.customer.city || '',
                  country,
                  isDefault: true,
                },
              },
            }),
          },
          select: { id: true },
        })
        customerId = created.id
      }

      // 2. Création de la commande.
      const orderNumber = generateOrderNumber()
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          customerName: data.customer.name,
          customerEmail: email ?? `admin-${Date.now()}@dardmana.internal`,
          customerPhone: phone,
          shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
          items: itemsSnapshot as unknown as Prisma.InputJsonValue,
          subtotalMad,
          shippingCostMad: 0,
          discountMad: 0,
          totalMad,
          currency: 'MAD',
          paymentMethod: data.paymentMethod as PaymentMethod,
          paymentStatus,
          orderStatus: data.orderStatus as OrderStatus,
          source: data.source as OrderSource,
          adminNotes: data.notes ?? null,
          createdAt: orderDate,
          orderItems: { createMany: { data: orderItemsData } },
        },
        select: { id: true },
      })

      // 3. Décrémente le stock (et incrémente les ventes) sauf si annulée.
      if (data.orderStatus !== 'CANCELLED') {
        for (const item of data.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
          })
        }
      }

      // 4. Historique de statut initial.
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: data.orderStatus as OrderStatus,
          note: 'Commande créée manuellement (admin)',
          changedBy: session.adminEmail,
        },
      })

      return { id: order.id, orderNumber }
    })

    // Notification WhatsApp admin (CallMeBot) — non bloquant.
    await notifyAdminWhatsApp({
      orderNumber: result.orderNumber,
      customerName: data.customer.name,
      customerPhone: phone,
      totalMad,
      paymentMethod: data.paymentMethod,
      source: data.source,
      orderItems: itemsSnapshot.map((i) => ({ productName: i.name, quantity: i.quantity })),
    }).catch((err) => console.error('[POST /api/admin/orders] Notif WhatsApp échouée (non bloquant):', err))

    return NextResponse.json({ success: true, orderId: result.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/orders]', error)
    return NextResponse.json({ error: 'Erreur serveur lors de la création' }, { status: 500 })
  }
}
