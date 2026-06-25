import type { Metadata } from 'next'
import { ensurePageEnabled } from "@/lib/nav-config"
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { localizedHref } from '@/lib/utils/locale'
import type { ProductCardData } from '@/lib/utils/product'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils/cn'
import type { Prisma } from '@prisma/client'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

const PRODUCT_SELECT = {
  id: true, slug: true, nameFr: true, nameAr: true, nameEn: true,
  priceMad: true, comparePriceMad: true, images: true,
  ratingAvg: true, ratingCount: true, isNew: true, stock: true,
} satisfies Prisma.ProductSelect

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'BestSellers' })
  const url = `${SITE_URL}/${locale}/best-sellers`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/best-sellers`
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: { title: `${t('metaTitle')} · Dar Dmana`, description: t('metaDescription'), url, siteName: 'Dar Dmana', type: 'website' },
  }
}

async function getBestSellers(categorySlug?: string): Promise<ProductCardData[]> {
  const categoryFilter = categorySlug ? { category: { slug: categorySlug } } : {}
  try {
    let products = await prisma.product.findMany({
      where: { status: 'ACTIVE', salesCount: { gt: 0 }, ...categoryFilter },
      orderBy: { salesCount: 'desc' },
      take: 20,
      select: PRODUCT_SELECT,
    })
    // Repli : si aucune vente enregistrée, on montre les produits « en vedette ».
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { status: 'ACTIVE', isFeatured: true, ...categoryFilter },
        orderBy: { salesCount: 'desc' },
        take: 20,
        select: PRODUCT_SELECT,
      })
    }
    return JSON.parse(JSON.stringify(products)) as ProductCardData[]
  } catch {
    return []
  }
}

type SP = Record<string, string | string[] | undefined>

export default async function BestSellersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SP>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)
  await ensurePageEnabled("bestSellers", locale)
  const t = await getTranslations('BestSellers')

  const activeCategory = typeof sp.category === 'string' ? sp.category : undefined

  const [products, categories] = await Promise.all([
    getBestSellers(activeCategory),
    prisma.category
      .findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { slug: true, nameFr: true, nameAr: true, nameEn: true } })
      .catch(() => []),
  ])

  const catName = (c: { nameFr: string; nameAr: string; nameEn: string }) =>
    locale === 'ar' ? c.nameAr : locale === 'en' ? c.nameEn : c.nameFr

  const pillHref = (slug?: string) =>
    localizedHref(locale, slug ? `/best-sellers?category=${slug}` : '/best-sellers')
  const pillCls = (active: boolean) =>
    cn(
      'whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
      active
        ? 'border-[var(--vert-fonce)] bg-[var(--vert-fonce)] text-[var(--creme)]'
        : 'border-[var(--bordure)] text-[var(--texte)] hover:border-[var(--or-royal)]',
    )

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-8">
        <span className="inline-block rounded-full bg-[var(--or-royal)]/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--or-royal)]">
          {t('badge')}
        </span>
        <h1 className="mt-3 font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">{t('title')}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--texte-doux)]">{t('subtitle')}</p>
      </header>

      {/* Pills catégories */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href={pillHref()} className={pillCls(!activeCategory)}>{t('all')}</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={pillHref(c.slug)} className={pillCls(activeCategory === c.slug)}>
              {catName(c)}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 border border-[var(--bordure)] py-24 text-center">
          <p className="text-sm text-[var(--texte-doux)]">{t('empty')}</p>
          <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="md">
            {t('browse')}
          </Button>
        </div>
      ) : (
        <ProductGrid products={products} priorityCount={3} />
      )}
    </div>
  )
}
