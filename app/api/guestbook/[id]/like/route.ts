import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST : incrémente likesCount (public, sans auth). L'anti-spam (1 like /
// navigateur) est géré côté client via localStorage.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const updated = await prisma.guestbookEntry.update({
      where: { id, isApproved: true },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    })

    return NextResponse.json({ success: true, likesCount: updated.likesCount })
  } catch (error) {
    // P2025 = entrée introuvable / non approuvée
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
    }
    console.error('[POST /api/guestbook/[id]/like]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
