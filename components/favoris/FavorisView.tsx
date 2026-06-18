'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { Button } from '@/components/ui/Button'
import { useWishlistStore } from '@/store/wishlist'
import { useHydrated } from '@/components/layout/hooks'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'
import type { ProductCardData } from '@/lib/utils/product'

export function FavorisView() {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const hydrated = useHydrated()
  const items = useWishlistStore((s) => s.items)

  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  // Mémorise les ids déjà récupérés pour éviter des fetchs redondants.
  const fetchedIds = useRef<string>('')

  useEffect(() => {
    if (!hydrated) return

    if (items.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    // Ne refetch que si de nouveaux ids apparaissent (les suppressions sont filtrées localement).
    const key = [...items].sort().join(',')
    const known = new Set(products.map((p) => p.id))
    const hasNew = items.some((id) => !known.has(id))
    if (!hasNew && fetchedIds.current === key) {
      setLoading(false)
      return
    }
    fetchedIds.current = key

    const controller = new AbortController()
    setLoading(true)
    fetch('/api/products/by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: items }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setProducts([])
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items])

  // Affiche uniquement les produits encore présents dans la wishlist (suppression réactive).
  const visible = products.filter((p) => items.includes(p.id))

  if (!hydrated || loading) {
    return <ProductGrid products={[]} loading skeletonCount={6} />
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 border border-[var(--bordure)] py-24 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gris-perle)] text-[var(--texte-doux)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 20s-7-4.35-9.2-8.3C1.3 8.9 2.6 5.8 5.6 5.2c1.9-.4 3.5.6 4.4 2 .9-1.4 2.5-2.4 4.4-2 3 .6 4.3 3.7 2.8 6.5C19 15.65 12 20 12 20z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="font-titre text-2xl text-[var(--vert-fonce)]">{t('Wishlist.emptyTitle')}</p>
        <p className="max-w-md text-sm leading-relaxed text-[var(--texte-doux)]">
          {t('Wishlist.emptyText')}
        </p>
        <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="md">
          {t('Wishlist.browseCatalogue')}
        </Button>
      </div>
    )
  }

  return (
    <>
      <p className="mb-8 text-sm text-[var(--texte-doux)]">
        {t('Wishlist.count', { count: visible.length })}
      </p>
      <ProductGrid products={visible} priorityCount={3} />
    </>
  )
}

export default FavorisView
