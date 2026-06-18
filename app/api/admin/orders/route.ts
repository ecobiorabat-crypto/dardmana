import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { Prisma, OrderStatus } from '@prisma/client'

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
