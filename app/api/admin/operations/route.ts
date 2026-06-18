import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { orderOrchestrator } from '@/lib/order-orchestrator'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!(user && user.email === process.env.ADMIN_EMAIL)
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      todayByStatus,
      ordersWithErrors,
      criticalStock,
      todayDeliveries,
    ] = await Promise.all([
      // Orders today grouped by status
      prisma.order.groupBy({
        by: ['orderStatus'],
        where: { createdAt: { gte: todayStart } },
        _count: true,
      }),

      // Orders with delivery errors (need retry)
      prisma.order.findMany({
        where: { deliveryError: { not: null } },
        select: {
          id: true, orderNumber: true, customerName: true,
          deliveryError: true, orderStatus: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Critical stock (stock = 0)
      prisma.product.findMany({
        where: { stock: 0, status: 'ACTIVE' },
        select: { id: true, slug: true, nameFr: true, stock: true, lowStockThreshold: true },
        orderBy: { salesCount: 'desc' },
        take: 20,
      }),

      // Today's shipped/processing orders (delivery summary)
      prisma.order.findMany({
        where: {
          createdAt: { gte: todayStart },
          orderStatus: { in: ['PROCESSING', 'SHIPPED'] },
        },
        select: {
          id: true, orderNumber: true, customerName: true, customerPhone: true,
          orderStatus: true, carrier: true, trackingNumber: true, paymentMethod: true, totalMad: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      todayByStatus,
      ordersWithErrors,
      criticalStock: JSON.parse(JSON.stringify(criticalStock)),
      todayDeliveries: JSON.parse(JSON.stringify(todayDeliveries)),
    })
  } catch (error) {
    console.error('[GET /api/admin/operations]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const { orderId } = (await request.json()) as { orderId?: string }
    if (!orderId) return NextResponse.json({ error: 'orderId requis' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderStatus: true, deliveryError: true },
    })

    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    // Clear previous error and retry
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryError: null },
    })

    await orderOrchestrator.processOrder(orderId)

    return NextResponse.json({ success: true, message: 'Envoi transporteur relancé avec succès' })
  } catch (error) {
    console.error('[POST /api/admin/operations]', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erreur lors de la relance',
    }, { status: 500 })
  }
}
