import type { Metadata } from 'next'

const SITE_NAME = 'Dar Dmana'
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma'

export interface ProductSeoData {
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  descriptionFr: string
  descriptionAr: string
  descriptionEn: string
  shortDescFr?: string | null
  metaTitleFr?: string | null
  metaTitleAr?: string | null
  metaTitleEn?: string | null
  metaDescriptionFr?: string | null
  metaDescriptionAr?: string | null
  metaDescriptionEn?: string | null
  images: string[]
  priceMad: number | string
  priceEur?: number | string | null
  ratingAvg?: number
  ratingCount?: number
}

export interface CategorySeoData {
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  descriptionFr?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  imageUrl?: string | null
  metaTitleFr?: string | null
  metaDescriptionFr?: string | null
}

type Locale = 'fr' | 'ar' | 'en'

function pick<T extends object>(obj: T, locale: Locale, field: string): string {
  const key = `${field}${locale.charAt(0).toUpperCase()}${locale.slice(1)}` as keyof T
  return (obj[key] as string | undefined | null) ?? ''
}

export function generateProductMetadata(product: ProductSeoData, locale: Locale = 'fr'): Metadata {
  const name = pick(product, locale, 'name')
  const description = pick(product, locale, 'metaDescription') || pick(product, locale, 'shortDesc') || pick(product, locale, 'description').slice(0, 160)
  const title = pick(product, locale, 'metaTitle') || `${name} | ${SITE_NAME}`
  const url = `${SITE_URL}/${locale}/produits/${product.slug}`
  const image = product.images[0] ?? `${SITE_URL}/og-default.jpg`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/produits/${product.slug}`,
        ar: `${SITE_URL}/ar/produits/${product.slug}`,
        en: `${SITE_URL}/en/products/${product.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 800, height: 800, alt: name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function generateCategoryMetadata(
  category: CategorySeoData,
  locale: Locale = 'fr'
): Metadata {
  const name = pick(category, locale, 'name')
  const description =
    category.metaDescriptionFr ||
    pick(category, locale, 'description')?.slice(0, 160) ||
    `Découvrez notre collection ${name} — artisanat marocain authentique`
  const title = category.metaTitleFr || `${name} | ${SITE_NAME}`
  const url = `${SITE_URL}/${locale}/categories/${category.slug}`
  const image = category.imageUrl ?? `${SITE_URL}/og-default.jpg`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/categories/${category.slug}`,
        ar: `${SITE_URL}/ar/categories/${category.slug}`,
        en: `${SITE_URL}/en/categories/${category.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function generateProductJsonLd(product: ProductSeoData): Record<string, unknown> {
  const image = product.images[0] ?? `${SITE_URL}/og-default.jpg`
  const url = `${SITE_URL}/fr/produits/${product.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameFr,
    description: product.descriptionFr,
    image: product.images.length > 0 ? product.images : [image],
    url,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MAD',
      price: Number(product.priceMad),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    ...(product.ratingCount && product.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }
}
