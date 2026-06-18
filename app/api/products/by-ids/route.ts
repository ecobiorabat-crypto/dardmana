import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_IDS = 100

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { ids?: unknown }

    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ error: 'ids[] requis' }, { status: 400 })
    }

    const ids = body.ids
      .filter((id): id is string => typeof id === 'string')
      .slice(0, MAX_IDS)

    if (ids.length === 0) {
      return NextResponse.json({ products: [] })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: {
        id: true,
        slug: true,
        nameFr: true,
        nameAr: true,
        nameEn: true,
        priceMad: true,
        comparePriceMad: true,
        images: true,
        ratingAvg: true,
        ratingCount: true,
        isNew: true,
        isFeatured: true,
        stock: true,
        category: { select: { slug: true } },
      },
    })

    // Conserve l'ordre des ids fournis par le client (ordre d'ajout aux favoris).
    const order = new Map(ids.map((id, i) => [id, i]))
    const sorted = products.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    )

    return NextResponse.json({ products: JSON.parse(JSON.stringify(sorted)) })
  } catch (error) {
    console.error('[POST /api/products/by-ids]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
