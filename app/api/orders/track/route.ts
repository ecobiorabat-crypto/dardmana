import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/utils/phone'

// GET /api/orders/track?orderNumber=DD-XXXX&phone=06...
// Recherche par numéro de commande + vérification du téléphone (sécurité).
export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get('orderNumber')?.trim()
  const phone = request.nextUrl.searchParams.get('phone')?.trim()

  if (!orderNumber || !phone) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        orderStatus: true,
        trackingNumber: true,
        carrier: true,
        items: true,
        totalMad: true,
        currency: true,
        createdAt: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: { status: true, note: true, createdAt: true },
        },
      },
    })

    // Réponse identique (404) si introuvable OU téléphone non concordant :
    // on ne révèle jamais l'existence d'une commande sans le bon téléphone.
    if (!order || normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        orderStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        items: order.items,
        totalMad: Number(order.totalMad),
        currency: order.currency,
        createdAt: order.createdAt,
        statusHistory: order.statusHistory.map((h) => ({
          status: h.status,
          note: h.note,
          createdAt: h.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/orders/track]', error)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
