import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

function startOf(unit: 'day' | 'week' | 'month'): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (unit === 'week') d.setDate(d.getDate() - d.getDay())
  if (unit === 'month') d.setDate(1)
  return d
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const todayStart = startOf('day')
    const weekStart = startOf('week')
    const monthStart = startOf('month')

    const [
      revToday, revWeek, revMonth,
      ordersToday, ordersPending, ordersProcessing,
      lowStockProducts, topProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { createdAt: { gte: todayStart }, paymentStatus: 'PAID' } }),
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { createdAt: { gte: weekStart }, paymentStatus: 'PAID' } }),
      prisma.order.aggregate({ _sum: { totalMad: true }, where: { createdAt: { gte: monthStart }, paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { orderStatus: 'NEW' } }),
      prisma.order.count({ where: { orderStatus: 'PROCESSING' } }),
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, slug: true, nameFr: true, stock: true, lowStockThreshold: true, images: true },
        orderBy: { stock: 'asc' },
        take: 20,
      }).then((products) => products.filter((p) => p.stock <= p.lowStockThreshold)),
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { salesCount: 'desc' },
        take: 5,
        select: { id: true, slug: true, nameFr: true, salesCount: true, priceMad: true, images: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, paymentStatus: 'PAID' },
        select: { createdAt: true, totalMad: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Group revenue by day
    const revenueByDay = recentOrders.reduce<Record<string, { date: string; revenue: number; orders: number }>>(
      (acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0]
        if (!acc[date]) acc[date] = { date, revenue: 0, orders: 0 }
        acc[date].revenue = Math.round((acc[date].revenue + Number(order.totalMad)) * 100) / 100
        acc[date].orders += 1
        return acc
      },
      {}
    )

    return NextResponse.json({
      revenue: {
        today: Number(revToday._sum.totalMad ?? 0),
        week: Number(revWeek._sum.totalMad ?? 0),
        month: Number(revMonth._sum.totalMad ?? 0),
      },
      orders: {
        today: ordersToday,
        pending: ordersPending,
        processing: ordersProcessing,
      },
      lowStockProducts: JSON.parse(JSON.stringify(lowStockProducts)),
      topProducts: JSON.parse(JSON.stringify(topProducts)),
      revenueByDay: Object.values(revenueByDay),
    })
  } catch (error) {
    console.error('[GET /api/admin/stats]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
