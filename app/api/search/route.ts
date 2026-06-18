import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const results = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { nameFr: { contains: q, mode: 'insensitive' } },
          { nameAr: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { descriptionFr: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q.toLowerCase()] } },
        ],
      },
      take: 20,
      orderBy: { salesCount: 'desc' },
      select: {
        id: true,
        slug: true,
        nameFr: true,
        nameAr: true,
        nameEn: true,
        shortDescFr: true,
        priceMad: true,
        images: true,
        category: { select: { slug: true, nameFr: true } },
      },
    })

    return NextResponse.json({ results, total: results.length })
  } catch (error) {
    console.error('[GET /api/search]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
