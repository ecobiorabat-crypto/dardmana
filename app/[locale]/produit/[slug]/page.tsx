import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ProductDetail, type ProductDetailData } from '@/components/product/ProductDetail'
import { ProductReviews } from '@/components/product/ProductReviews'
import { RelatedProducts } from '@/components/product/RelatedProducts'
import { pickLocale, type ProductCardData } from '@/lib/utils/product'
import { localizedHref } from '@/lib/utils/locale'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export const revalidate = 3600

interface PageParams {
  locale: string
  slug: string
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true },
    })
    return products.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { priceMad: 'asc' } },
    },
  })
  if (!product || product.status === 'ARCHIVED') return null

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, status: 'ACTIVE', slug: { not: slug } },
    take: 4,
    orderBy: { salesCount: 'desc' },
    select: {
      id: true, slug: true, nameFr: true, nameAr: true, nameEn: true,
      priceMad: true, comparePriceMad: true, images: true, ratingAvg: true, isNew: true,
    },
  })

  return {
    product: JSON.parse(JSON.stringify(product)),
    related: JSON.parse(JSON.stringify(related)) as ProductCardData[],
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { slug, locale } = await params
  try {
    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) return { title: 'Produit introuvable' }

    const name = pickLocale({ fr: product.nameFr, ar: product.nameAr, en: product.nameEn }, locale)
    const metaTitle = pickLocale(
      { fr: product.metaTitleFr ?? name, ar: product.metaTitleAr, en: product.metaTitleEn },
      locale,
    )
    const metaDesc = pickLocale(
      {
        fr: product.metaDescriptionFr ?? product.shortDescFr ?? '',
        ar: product.metaDescriptionAr ?? product.shortDescAr,
        en: product.metaDescriptionEn ?? product.shortDescEn,
      },
      locale,
    )
    const image = product.images?.[0]
    const url = `${SITE_URL}/${locale}/produit/${slug}`
    const languages: Record<string, string> = {}
    for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/produit/${slug}`

    const openGraph = {
      title: metaTitle,
      description: metaDesc || undefined,
      url,
      siteName: 'Dar Dmana',
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 1200, alt: name }] : undefined,
    } as unknown as Metadata['openGraph']

    return {
      title: metaTitle,
      description: metaDesc || `Découvrez ${name} sur Dar Dmana.`,
      alternates: { canonical: url, languages },
      openGraph,
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDesc || undefined,
        images: image ? [image] : undefined,
      },
    }
  } catch {
    return { title: 'Produit' }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const data = await getProduct(slug)
  if (!data) notFound()

  const product = data.product as ProductDetailData & {
    category: { slug: string; nameFr: string; nameAr: string; nameEn: string }
    ratingAvg: number
    ratingCount: number
    sku: string | null
  }

  const name = pickLocale({ fr: product.nameFr, ar: product.nameAr, en: product.nameEn }, locale)
  const categoryName = pickLocale(
    { fr: product.category.nameFr, ar: product.category.nameAr, en: product.category.nameEn },
    locale,
  )

  const productUrl = `${SITE_URL}/${locale}/produit/${product.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: product.images,
    description: pickLocale(
      { fr: product.shortDescFr ?? product.descriptionFr, ar: product.shortDescAr, en: product.shortDescEn },
      locale,
    ),
    category: categoryName,
    sku: product.sku ?? undefined,
    brand: { '@type': 'Brand', name: 'Dar Dmana' },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'MAD',
      price: Number(product.priceMad),
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Dar Dmana' },
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.ratingAvg,
        reviewCount: product.ratingCount,
      },
    }),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* OG produit (hoistés dans <head> par React 19) */}
      <meta property="og:price:amount" content={String(Number(product.priceMad))} />
      <meta property="og:price:currency" content="MAD" />
      <meta property="product:price:amount" content={String(Number(product.priceMad))} />
      <meta property="product:price:currency" content="MAD" />

      {/* Breadcrumb */}
      <nav aria-label={t('Common.breadcrumb')} className="mb-8 text-xs text-[var(--texte-doux)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={localizedHref(locale, '/')} className="hover:text-[var(--vert-fonce)]">
              {t('Nav.home')}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={localizedHref(locale, `/catalogue/${product.category.slug}`)}
              className="hover:text-[var(--vert-fonce)]"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--texte)]">{name}</li>
        </ol>
      </nav>

      <ProductDetail product={product} locale={locale} />

      <div className="mt-16 space-y-16">
        <ProductReviews
          productId={product.id}
          initialAvg={product.ratingAvg}
          initialCount={product.ratingCount}
        />
        <RelatedProducts products={data.related} />
      </div>
    </div>
  )
}
