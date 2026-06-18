'use client'

import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductCardData } from '@/lib/utils/product'

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  const t = useTranslations()
  if (!products.length) return null

  return (
    <section className="border-t border-[var(--bordure)] pt-12">
      <h2 className="mb-8 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">
        {t('Products.similar')}
      </h2>

      {/* Carousel horizontal sur mobile, grille sur desktop */}
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {products.map((p) => (
          <div key={p.id} className="w-56 shrink-0 snap-start lg:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default RelatedProducts
