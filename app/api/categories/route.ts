import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('[GET /api/categories]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
