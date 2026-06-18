import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { priceMad: 'asc' } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, customerName: true, customerCountry: true,
            rating: true, title: true, content: true,
            isVerified: true, createdAt: true,
          },
        },
      },
    })

    if (!product || product.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    // Increment view count (fire and forget)
    prisma.product.update({ where: { slug }, data: { viewsCount: { increment: 1 } } })
      .catch(() => { /* non-blocking */ })

    // Related products (same category, different product)
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        status: 'ACTIVE',
        slug: { not: slug },
      },
      take: 4,
      orderBy: { salesCount: 'desc' },
      select: {
        id: true, slug: true, nameFr: true, nameAr: true, nameEn: true,
        priceMad: true, comparePriceMad: true, images: true, ratingAvg: true, isNew: true,
      },
    })

    return NextResponse.json({
      product: JSON.parse(JSON.stringify(product)),
      related: JSON.parse(JSON.stringify(related)),
    })
  } catch (error) {
    console.error('[GET /api/products/[slug]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
