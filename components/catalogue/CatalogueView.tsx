'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { FilterSidebar, type FilterCategory } from '@/components/shop/FilterSidebar'
import type { ProductCardData } from '@/lib/utils/product'
import { useCurrentLocale } from '@/components/layout/nav'

type Category = FilterCategory

interface SortOption {
  key: string
  labelKey: string
  sortBy: string
  sortOrder: string
}

const SORTS: SortOption[] = [
  { key: 'pertinence', labelKey: 'Catalogue.relevance', sortBy: 'createdAt', sortOrder: 'desc' },
  { key: 'prix-asc', labelKey: 'Catalogue.priceAsc', sortBy: 'priceMad', sortOrder: 'asc' },
  { key: 'prix-desc', labelKey: 'Catalogue.priceDesc', sortBy: 'priceMad', sortOrder: 'desc' },
  { key: 'nouveautes', labelKey: 'Catalogue.newest', sortBy: 'createdAt', sortOrder: 'desc' },
  { key: 'ventes', labelKey: 'Catalogue.bestSelling', sortBy: 'salesCount', sortOrder: 'desc' },
]

const PAGE_SIZE = 12
const PRICE_MAX = 5000

export interface CatalogueViewProps {
  /** Verrouille le filtre catégorie (page /catalogue/[category]). */
  lockedCategory?: string
}

export function CatalogueView({ lockedCategory }: CatalogueViewProps) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const category = lockedCategory ?? searchParams.get('category') ?? ''
  const minPrice = Number(searchParams.get('minPrice') ?? 0)
  const maxPrice = Number(searchParams.get('maxPrice') ?? PRICE_MAX)
  const minRating = Number(searchParams.get('minRating') ?? 0)
  const onlyNew = searchParams.get('isNew') === 'true'
  const sortKey = searchParams.get('sort') ?? 'pertinence'

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductCardData[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0]

  const filtersKey = useMemo(
    () => `${category}|${minPrice}|${maxPrice}|${onlyNew}|${sortKey}`,
    [category, minPrice, maxPrice, onlyNew, sortKey],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/categories', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  function buildQuery(p: number): string {
    const q = new URLSearchParams()
    if (category) q.set('categorySlug', category)
    if (minPrice > 0) q.set('minPrice', String(minPrice))
    if (maxPrice < PRICE_MAX) q.set('maxPrice', String(maxPrice))
    if (onlyNew) q.set('isNew', 'true')
    q.set('sortBy', sort.sortBy)
    q.set('sortOrder', sort.sortOrder)
    q.set('page', String(p))
    q.set('limit', String(PAGE_SIZE))
    return q.toString()
  }

  // Recharge la page 1 quand les filtres changent
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/products?${buildQuery(1)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? [])
        setTotal(d.total ?? 0)
        setPage(1)
        setLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setProducts([])
          setLoading(false)
        }
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/products?${buildQuery(page + 1)}`)
      const d = await res.json()
      setProducts((prev) => [...(prev ?? []), ...(d.products ?? [])])
      setPage((p) => p + 1)
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false)
    }
  }

  function updateParam(updates: Record<string, string | null>) {
    setLoading(true)
    const q = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') q.delete(key)
      else q.set(key, value)
    }
    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }

  const displayed = (products ?? []).filter(
    (p) => !minRating || (p.ratingAvg ?? 0) >= minRating,
  )
  const canLoadMore = (products?.length ?? 0) < total

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar filtres */}
      <FilterSidebar
        categories={categories}
        locale={locale}
        hideCategories={!!lockedCategory}
        priceMax={PRICE_MAX}
        values={{ category, minPrice, maxPrice, minRating, onlyNew }}
        onUpdate={updateParam}
      />

      {/* Grille */}
      <div>
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--bordure)] pb-4">
          <p className="text-sm text-[var(--texte-doux)]">
            {loading ? t('Common.loading') : t('Catalogue.showing', { count: total })}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-[var(--texte-doux)] sm:inline">{t('Catalogue.sortBy')}</span>
            <select
              value={sortKey}
              onChange={(e) => updateParam({ sort: e.target.value })}
              className="border border-[var(--bordure)] bg-[var(--blanc)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
              aria-label={t('Catalogue.sortBy')}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <ProductGrid products={displayed} loading={loading} priorityCount={3} />

        {!loading && displayed.length > 0 && canLoadMore && (
          <div className="mt-12 flex justify-center">
            <Button variant="outline" size="md" loading={loadingMore} onClick={loadMore}>
              {t('Catalogue.loadMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CatalogueView
