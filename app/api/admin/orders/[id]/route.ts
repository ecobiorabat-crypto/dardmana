import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { orderOrchestrator } from '@/lib/order-orchestrator'
import { guardAdminApi } from '@/lib/auth/admin-api-guard'
import type { OrderStatus, Prisma } from '@prisma/client'

async function verifyAdmin(request: NextRequest): Promise<{ ok: boolean; email?: string }> {
  void request
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return { ok: false }
  return { ok: true, email: user.email }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin.ok) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: { select: { slug: true, images: true } } } },
        payments: true,
        trackingEvents: { orderBy: { occurredAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        notificationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        customer: { select: { id: true, name: true, email: true, totalOrders: true, totalSpentMad: true } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
  } catch (error) {
    console.error('[GET /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin.ok) return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })

    const { id } = await params
    const body = (await request.json()) as {
      orderStatus?: string
      adminNotes?: string
      trackingNumber?: string
      carrier?: string
    }

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, orderStatus: true } })
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

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
          changedBy: admin.email ?? 'admin',
          note: body.adminNotes ?? null,
        },
      })
    }

    return NextResponse.json({ order: JSON.parse(JSON.stringify(updated)) })
  } catch (error) {
    console.error('[PATCH /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Suppression DÉFINITIVE d'une commande (irréversible).
 * - Session admin + permission orders.update.
 * - Réservé à SUPER_ADMIN et ADMIN (pas MANAGER/SUPPORT/STOCK).
 * - Supprime en cascade : OrderItem, OrderStatusHistory, Payment, TrackingEvent,
 *   NotificationLog liés.
 * - Restaure le stock si la commande n'est ni CANCELLED ni REFUNDED.
 * - Journalise la suppression dans AuditLog (email admin).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await guardAdminApi(request, 'orders.update')
    if (!guard.ok) return guard.response

    const { role, adminEmail } = guard.session
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Suppression réservée aux administrateurs (SUPER_ADMIN, ADMIN)' },
        { status: 403 },
      )
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: { select: { productId: true, quantity: true } } },
    })

    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    // Restaure le stock sauf si déjà annulée/remboursée (stock déjà rétabli).
    if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REFUNDED') {
      await orderOrchestrator.rollbackStock(order.orderItems)
    }

    // Suppression en cascade explicite (NotificationLog.orderId est optionnel et
    // ne cascade pas automatiquement à la suppression de la commande).
    await prisma.$transaction([
      prisma.notificationLog.deleteMany({ where: { orderId: id } }),
      prisma.trackingEvent.deleteMany({ where: { orderId: id } }),
      prisma.orderStatusHistory.deleteMany({ where: { orderId: id } }),
      prisma.payment.deleteMany({ where: { orderId: id } }),
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ])

    // Journal d'audit (snapshot de la commande supprimée).
    await prisma.auditLog.create({
      data: {
        adminEmail,
        action: 'order.delete',
        resourceType: 'Order',
        resourceId: id,
        before: JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
      },
    })

    return NextResponse.json({ success: true, message: 'Commande supprimée définitivement' })
  } catch (error) {
    console.error('[DELETE /api/admin/orders/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
