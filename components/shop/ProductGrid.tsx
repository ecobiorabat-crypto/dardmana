'use client'

import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ProductCardData } from '@/lib/utils/product'
import { cn } from '@/lib/utils/cn'

export interface ProductGridProps {
  products: ProductCardData[]
  loading?: boolean
  skeletonCount?: number
  emptyTitle?: string
  emptyText?: string
  className?: string
  /** Donne la priorité de chargement aux N premières images (LCP). */
  priorityCount?: number
}

/** Grille produits responsive avec états de chargement et vide intégrés. */
export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 6,
  emptyTitle,
  emptyText,
  className,
  priorityCount = 0,
}: ProductGridProps) {
  const t = useTranslations()
  const gridClass = cn(
    'grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3',
    className,
  )

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} variant="product" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="font-titre text-2xl text-[var(--vert-fonce)]">{emptyTitle ?? t('Catalogue.noProductsTitle')}</p>
        <p className="max-w-sm text-sm text-[var(--texte-doux)]">{emptyText ?? t('Catalogue.noProductsText')}</p>
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  )
}

export default ProductGrid
