import { Suspense } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { CatalogueView } from '@/components/catalogue/CatalogueView'
import { pickLocale } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export const revalidate = 3600

interface PageParams {
  locale: string
  category: string
}

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    })
    return categories.map((c) => ({ category: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>
}): Promise<Metadata> {
  const { category, locale } = await params
  try {
    const cat = await prisma.category.findUnique({ where: { slug: category } })
    if (!cat) return { title: 'Catégorie' }
    const name = pickLocale({ fr: cat.nameFr, ar: cat.nameAr, en: cat.nameEn }, locale)
    const desc = pickLocale(
      { fr: cat.descriptionFr ?? '', ar: cat.descriptionAr, en: cat.descriptionEn },
      locale,
    )
    const url = `${SITE_URL}/${locale}/catalogue/${category}`
    const languages: Record<string, string> = {}
    for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/catalogue/${category}`
    const description = desc || `Découvrez la collection ${name} de Dar Dmana.`

    return {
      title: name,
      description,
      alternates: { canonical: url, languages },
      openGraph: {
        title: `${name} · Dar Dmana`,
        description,
        url,
        siteName: 'Dar Dmana',
        type: 'website',
        images: cat.imageUrl ? [{ url: cat.imageUrl }] : undefined,
      },
    }
  } catch {
    return { title: 'Catégorie' }
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { locale, category } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const cat = await prisma.category.findUnique({ where: { slug: category } })
  if (!cat) notFound()

  const name = pickLocale({ fr: cat.nameFr, ar: cat.nameAr, en: cat.nameEn }, locale)
  const desc = pickLocale(
    { fr: cat.descriptionFr ?? '', ar: cat.descriptionAr, en: cat.descriptionEn },
    locale,
  )

  const catProducts = await prisma.product
    .findMany({
      where: { categoryId: cat.id, status: 'ACTIVE' },
      orderBy: { salesCount: 'desc' },
      take: 24,
      select: { slug: true, nameFr: true, nameAr: true, nameEn: true },
    })
    .catch(() => [])

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Collection ${name} · Dar Dmana`,
    numberOfItems: catProducts.length,
    itemListElement: catProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${locale}/produit/${p.slug}`,
      name: pickLocale({ fr: p.nameFr, ar: p.nameAr, en: p.nameEn }, locale),
    })),
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* Header catégorie */}
      <header className="relative overflow-hidden bg-[var(--vert-fonce)] pt-28 pb-14 text-[var(--creme)] lg:pt-32 lg:pb-16">
        {cat.imageUrl && (
          <>
            <Image
              src={cat.imageUrl}
              alt={name}
              fill
              sizes="100vw"
              priority
              className="absolute inset-0 object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--vert-fonce)] to-transparent" />
          </>
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-clair)]">
            {t('Catalogue.collection')}
          </p>
          <h1 className="font-titre text-4xl sm:text-5xl">{name}</h1>
          {desc && <p className="mt-4 max-w-xl text-sm text-[var(--creme)]/80">{desc}</p>}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <CatalogueView lockedCategory={category} />
        </Suspense>
      </div>
    </div>
  )
}
