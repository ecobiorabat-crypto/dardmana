import type { Metadata } from 'next'
import { ensurePageEnabled } from "@/lib/nav-config"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { localizedHref } from '@/lib/utils/locale'
import type { ProductCardData } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'New' })
  const url = `${SITE_URL}/${locale}/nouveautes`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/nouveautes`

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${t('title')} · Dar Dmana`,
      description: t('subtitle'),
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

async function getNewProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', isNew: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
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
        stock: true,
      },
    })
    return JSON.parse(JSON.stringify(products)) as ProductCardData[]
  } catch {
    return []
  }
}

export default async function NouveautesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await ensurePageEnabled("nouveautes", locale)
  const t = await getTranslations()

  const products = await getNewProducts()

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
          {t('New.eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
          {t('New.title')}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--texte-doux)]">
          {t('New.subtitle')}
        </p>
      </header>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 border border-[var(--bordure)] py-24 text-center">
          <p className="font-titre text-2xl text-[var(--vert-fonce)]">{t('New.emptyTitle')}</p>
          <p className="max-w-md text-sm leading-relaxed text-[var(--texte-doux)]">
            {t('New.emptyText')}
          </p>
          <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="md">
            {t('New.browseCatalogue')}
          </Button>
        </div>
      ) : (
        <ProductGrid products={products} priorityCount={3} />
      )}
    </div>
  )
}
