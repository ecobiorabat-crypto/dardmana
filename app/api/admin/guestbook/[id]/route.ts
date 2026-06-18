import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/auth/admin'
import { hasPermission } from '@/lib/auth/permissions'

const PatchSchema = z.object({
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

async function guard(request: NextRequest) {
  const session = await verifyAdminSession(request)
  if (!session) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  if (!hasPermission(session.role, 'cms.update')) {
    return { error: NextResponse.json({ error: 'Permission insuffisante' }, { status: 403 }) }
  }
  return { error: null }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await guard(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const updated = await prisma.guestbookEntry.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, entry: JSON.parse(JSON.stringify(updated)) })
  } catch (err) {
    if (typeof err === 'object' && err && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
    }
    console.error('[PATCH /api/admin/guestbook/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await guard(request)
  if (error) return error

  try {
    const { id } = await params
    await prisma.guestbookEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (typeof err === 'object' && err && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
    }
    console.error('[DELETE /api/admin/guestbook/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
