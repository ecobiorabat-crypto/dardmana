import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'

const PatchSchema = z.object({
  tiktokFollowers: z.number().int().min(0).optional(),
  tiktokLikes: z.number().int().min(0).optional(),
  tiktokHandle: z.string().trim().max(60).optional().or(z.literal('')),
  googleRating: z.number().min(0).max(5).optional(),
  googleReviewsCount: z.number().int().min(0).optional(),
  satisfactionRate: z.number().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  const stats = await prisma.brandStats.findFirst().catch(() => null)
  return NextResponse.json({ stats: stats ? JSON.parse(JSON.stringify(stats)) : null })
}

export async function PATCH(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!hasPermission(session.role, 'cms.update')) {
    return NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data = { ...parsed.data, updatedBy: session.adminEmail }

    // Singleton : met à jour la ligne existante, ou la crée si absente.
    const existing = await prisma.brandStats.findFirst()
    const stats = existing
      ? await prisma.brandStats.update({ where: { id: existing.id }, data })
      : await prisma.brandStats.create({ data })

    return NextResponse.json({ success: true, stats: JSON.parse(JSON.stringify(stats)) })
  } catch (error) {
    console.error('[PATCH /api/admin/brand-stats]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
