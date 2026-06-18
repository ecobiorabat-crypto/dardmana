import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'
import type { Prisma } from '@prisma/client'

// GET /api/admin/guestbook?status=pending|approved|featured|all
export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const status = request.nextUrl.searchParams.get('status') ?? 'pending'

    const where: Prisma.GuestbookEntryWhereInput =
      status === 'approved'
        ? { isApproved: true }
        : status === 'featured'
          ? { isFeatured: true }
          : status === 'all'
            ? {}
            : { isApproved: false }

    const [entries, pendingCount] = await Promise.all([
      prisma.guestbookEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.guestbookEntry.count({ where: { isApproved: false } }),
    ])

    return NextResponse.json({
      entries: JSON.parse(JSON.stringify(entries)),
      pendingCount,
    })
  } catch (error) {
    console.error('[GET /api/admin/guestbook]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
