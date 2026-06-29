import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const BRAND = 'Dar Dmana'
const CURRENCY = 'MAD'

/**
 * Feed Meta Product Catalog (JSON) — tous les produits actifs.
 * Champs : id, title, description, price, currency, image_url, url,
 * availability, brand. Permet au crawler Meta d'alimenter le catalogue
 * publicitaire (Advantage+, retargeting). Référencé dans robots.txt.
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        nameFr: true,
        descriptionFr: true,
        priceMad: true,
        images: true,
        stock: true,
      },
    })

    const items = products.map((p) => ({
      id: p.id,
      title: p.nameFr,
      description: p.descriptionFr,
      price: Number(p.priceMad),
      currency: CURRENCY,
      image_url: p.images[0] ?? '',
      url: `${SITE_URL}/${routing.defaultLocale}/produit/${p.slug}`,
      availability: p.stock > 0 ? 'in stock' : 'out of stock',
      brand: BRAND,
    }))

    return NextResponse.json(
      { count: items.length, products: items },
      {
        headers: {
          // Cache CDN 1h (feed produit) avec rafraîchissement en arrière-plan.
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    )
  } catch (error) {
    console.error('[GET /api/meta/catalog]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
