'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ProductCardData } from '@/lib/utils/product'

/**
 * Carrousel horizontal de produits vedettes (image, nom, prix, bouton panier
 * via ProductCard). Alternative au bloc « best-sellers » classique.
 */
export function FeaturedSlider({ featuredIds }: { featuredIds?: string[] }) {
  const t = useTranslations()
  const [products, setProducts] = useState<ProductCardData[] | null>(null)

  const key = featuredIds?.join(',') ?? ''
  useEffect(() => {
    const controller = new AbortController()
    const query = key ? `ids=${encodeURIComponent(key)}&limit=8` : 'isFeatured=true&limit=8'
    fetch(`/api/products?${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
    return () => controller.abort()
  }, [key])

  return (
    <section className="bg-[var(--sable)]/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--laiton)]">
            {t('Products.bestSellersSubtitle')}
          </p>
          <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
            {t('Products.bestSellers')}
          </h2>
        </div>

        {products === null ? (
          <div className="flex gap-4 overflow-hidden pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[70%] shrink-0 sm:w-[300px]">
                <Skeleton variant="product" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--texte-doux)]">{t('Products.empty')}</p>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
            {products.map((p) => (
              <div key={p.id} className="w-[70%] shrink-0 snap-start sm:w-[300px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedSlider
