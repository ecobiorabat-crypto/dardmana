'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ProductCardData } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

export interface BestSellersProps {
  /** Sélection CMS de produits mis en avant ; sinon repli sur isFeatured. */
  featuredIds?: string[]
}

export function BestSellers({ featuredIds }: BestSellersProps = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const [products, setProducts] = useState<ProductCardData[] | null>(null)

  const featuredKey = featuredIds?.join(',') ?? ''
  useEffect(() => {
    const controller = new AbortController()
    const query = featuredKey
      ? `ids=${encodeURIComponent(featuredKey)}&limit=8`
      : 'isFeatured=true&limit=4'
    fetch(`/api/products?${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
    return () => controller.abort()
  }, [featuredKey])

  return (
    <section className="bg-[var(--gris-perle)]/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
                {t('Products.bestSellersSubtitle')}
              </p>
              <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
                {t('Products.bestSellers')}
              </h2>
            </div>
            <Button href={localizedHref(locale, '/catalogue')} variant="ghost" size="sm">
              {t('Common.viewAll')}
            </Button>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products === null ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="product" />)
          ) : products.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-[var(--texte-doux)]">
              {t('Products.empty')}
            </p>
          ) : (
            products.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.05}>
                <ProductCard product={product} />
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default BestSellers
