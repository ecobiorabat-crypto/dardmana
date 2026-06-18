import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        trackingEvents: { orderBy: { occurredAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    // Verify ownership: admin can see all, customer can only see their own
    const isAdmin = user.email === process.env.ADMIN_EMAIL
    if (!isAdmin) {
      const customer = await prisma.customer.findUnique({
        where: { authUserId: user.id },
        select: { id: true },
      })
      if (!customer || order.customerId !== customer.id) {
        if (order.customerEmail !== user.email) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
        }
      }
    }

    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
  } catch (error) {
    console.error('[GET /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const body = (await request.json()) as {
      orderStatus?: string
      adminNotes?: string
      trackingNumber?: string
      carrier?: string
    }

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, orderStatus: true } })
    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(body.orderStatus && { orderStatus: body.orderStatus as OrderStatus }),
        ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
        ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
        ...(body.carrier !== undefined && { carrier: body.carrier }),
      },
    })

    if (body.orderStatus && body.orderStatus !== order.orderStatus) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: id,
          status: body.orderStatus as OrderStatus,
          changedBy: user.email,
          note: body.adminNotes ?? null,
        },
      })
    }

    return NextResponse.json({ order: JSON.parse(JSON.stringify(updated)) })
  } catch (error) {
    console.error('[PATCH /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
