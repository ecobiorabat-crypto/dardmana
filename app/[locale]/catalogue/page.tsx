import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CatalogueView } from '@/components/catalogue/CatalogueView'
import { prisma } from '@/lib/prisma'
import { pickLocale } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const url = `${SITE_URL}/${locale}/catalogue`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/catalogue`

  return {
    title: t('Nav.catalogue'),
    description: 'Découvrez toutes les créations Dar Dmana — l\u2019artisanat marocain réinventé.',
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${t('Nav.catalogue')} · ${t('Common.brand')}`,
      description: 'Toutes les créations Dar Dmana.',
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

async function getItemListLd(locale: string) {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { salesCount: 'desc' },
      take: 24,
      select: { slug: true, nameFr: true, nameAr: true, nameEn: true },
    })
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Catalogue Dar Dmana',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${locale}/produit/${p.slug}`,
        name: pickLocale({ fr: p.nameFr, ar: p.nameAr, en: p.nameEn }, locale),
      })),
    }
  } catch {
    return null
  }
}

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  const itemListLd = await getItemListLd(locale)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      {itemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}

      <header className="mb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
          {t('Catalogue.eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
          {t('Catalogue.title')}
        </h1>
      </header>

      <Suspense fallback={null}>
        <CatalogueView />
      </Suspense>
    </div>
  )
}
