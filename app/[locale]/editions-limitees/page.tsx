import type { Metadata } from 'next'
import { ensurePageEnabled } from "@/lib/nav-config"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { localizedHref } from '@/lib/utils/locale'
import type { ProductCardData } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const LIMITED_THRESHOLD = 10

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'LimitedEditions' })
  const url = `${SITE_URL}/${locale}/editions-limitees`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/editions-limitees`
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: { title: `${t('metaTitle')} · Dar Dmana`, description: t('metaDescription'), url, siteName: 'Dar Dmana', type: 'website' },
  }
}

async function getLimitedProducts(): Promise<ProductCardData[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ tags: { has: 'limited' } }, { stock: { lte: LIMITED_THRESHOLD } }],
      },
      orderBy: { stock: 'asc' },
      take: 24,
      select: {
        id: true, slug: true, nameFr: true, nameAr: true, nameEn: true,
        priceMad: true, comparePriceMad: true, images: true,
        ratingAvg: true, ratingCount: true, isNew: true, stock: true,
      },
    })
    return JSON.parse(JSON.stringify(products)) as ProductCardData[]
  } catch {
    return []
  }
}

export default async function EditionsLimiteesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await ensurePageEnabled("editionsLimitees", locale)
  const t = await getTranslations()

  const products = await getLimitedProducts()

  return (
    <div className="pb-20">
      {/* Header sombre */}
      <section className="bg-gradient-to-br from-[var(--noir)] via-[var(--vert-fonce)] to-[var(--noir)] px-4 pt-28 pb-14 text-center sm:px-6 lg:pt-32">
        <span className="inline-block rounded-full bg-[var(--erreur)]/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--or-clair)]">
          {t('LimitedEditions.badge')}
        </span>
        <h1 className="mt-4 font-titre text-4xl text-[var(--creme)] sm:text-5xl">{t('LimitedEditions.title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--creme)]/80">
          {t('LimitedEditions.subtitle')}
        </p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 border border-[var(--bordure)] py-24 text-center">
            <p className="font-titre text-2xl text-[var(--vert-fonce)]">{t('LimitedEditions.emptyTitle')}</p>
            <p className="max-w-md text-sm leading-relaxed text-[var(--texte-doux)]">{t('LimitedEditions.emptyText')}</p>
            <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="md">
              {t('LimitedEditions.browse')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {products.map((p, i) => {
              const stock = typeof p.stock === 'number' ? p.stock : 0
              const width = Math.max(8, Math.min(100, (stock / LIMITED_THRESHOLD) * 100))
              return (
                <div key={p.id}>
                  <ProductCard product={p} priority={i < 3} />
                  {stock > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--erreur)]/15">
                        <div className="h-full rounded-full bg-[var(--erreur)]" style={{ width: `${width}%` }} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-[var(--erreur)]">
                        {t('Products.limitedStock', { count: stock })}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
