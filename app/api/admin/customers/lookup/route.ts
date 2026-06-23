import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import { normalizePhone } from '@/lib/utils/phone'

// GET /api/admin/customers/lookup?phone=...
// Renvoie le client correspondant (nom, email, adresse par défaut) si trouvé.
export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'orders.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const raw = request.nextUrl.searchParams.get('phone') ?? ''
  const phone = normalizePhone(raw.trim())
  if (!phone) return NextResponse.json({ customer: null })

  try {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        totalOrders: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          take: 1,
          select: { addressLine1: true, city: true, country: true },
        },
      },
    })

    if (!customer) return NextResponse.json({ customer: null })

    const addr = customer.addresses[0]
    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        country: addr?.country ?? customer.country,
        addressLine1: addr?.addressLine1 ?? '',
        city: addr?.city ?? '',
        totalOrders: customer.totalOrders,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/customers/lookup]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
