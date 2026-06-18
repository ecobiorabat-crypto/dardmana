'use client'

import { useTranslations } from 'next-intl'
import { pickLocale } from '@/lib/utils/product'
import { cn } from '@/lib/utils/cn'

export interface FilterCategory {
  id: string
  slug: string
  nameFr: string
  nameAr: string | null
  nameEn: string | null
  _count?: { products: number }
}

export interface FilterValues {
  category: string
  minPrice: number
  maxPrice: number
  minRating: number
  onlyNew: boolean
}

export interface FilterSidebarProps {
  categories: FilterCategory[]
  locale: string
  values: FilterValues
  onUpdate: (updates: Record<string, string | null>) => void
  /** Masque le groupe Catégories (pages catégorie verrouillées). */
  hideCategories?: boolean
  priceMax?: number
  className?: string
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vert-fonce)]">
        {title}
      </h3>
      {children}
    </div>
  )
}

/** Barre latérale de filtres du catalogue (catégories, prix, note, nouveautés). */
export function FilterSidebar({
  categories,
  locale,
  values,
  onUpdate,
  hideCategories = false,
  priceMax = 5000,
  className,
}: FilterSidebarProps) {
  const t = useTranslations()
  const { category, minPrice, maxPrice, minRating, onlyNew } = values

  return (
    <aside className={cn('lg:sticky lg:top-28 lg:self-start', className)}>
      <div className="space-y-8">
        {!hideCategories && (
          <FilterGroup title={t('Catalogue.categories')}>
            <ul className="space-y-2">
              {categories.map((c) => {
                const name = pickLocale({ fr: c.nameFr, ar: c.nameAr, en: c.nameEn }, locale)
                const checked = category === c.slug
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--texte)]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onUpdate({ category: checked ? null : c.slug })}
                        className="h-4 w-4 accent-[var(--vert-fonce)]"
                      />
                      <span className="flex-1">{name}</span>
                      {c._count && (
                        <span className="text-xs text-[var(--texte-doux)]">{c._count.products}</span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          </FilterGroup>
        )}

        <FilterGroup title={t('Catalogue.price')}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--texte-doux)]">
              <span>{minPrice} MAD</span>
              <span>{maxPrice} MAD</span>
            </div>
            <input
              type="range"
              min={0}
              max={priceMax}
              step={50}
              value={maxPrice}
              onChange={(e) => onUpdate({ maxPrice: e.target.value })}
              className="w-full accent-[var(--or-royal)]"
              aria-label={t('Catalogue.maxPrice')}
            />
            <input
              type="range"
              min={0}
              max={priceMax}
              step={50}
              value={minPrice}
              onChange={(e) => onUpdate({ minPrice: e.target.value })}
              className="w-full accent-[var(--vert-fonce)]"
              aria-label={t('Catalogue.minPrice')}
            />
          </div>
        </FilterGroup>

        <FilterGroup title={t('Catalogue.minRating')}>
          <ul className="space-y-2">
            {[0, 3, 4].map((r) => (
              <li key={r}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--texte)]">
                  <input
                    type="radio"
                    name="minRating"
                    checked={minRating === r}
                    onChange={() => onUpdate({ minRating: r ? String(r) : null })}
                    className="h-4 w-4 accent-[var(--or-royal)]"
                  />
                  <span>{r === 0 ? t('Catalogue.allRatings') : t('Catalogue.ratingAndUp', { count: r })}</span>
                </label>
              </li>
            ))}
          </ul>
        </FilterGroup>

        <FilterGroup title={t('Catalogue.newest')}>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--texte)]">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={() => onUpdate({ isNew: onlyNew ? null : 'true' })}
              className="h-4 w-4 accent-[var(--vert-fonce)]"
            />
            <span>{t('Catalogue.showNewOnly')}</span>
          </label>
        </FilterGroup>
      </div>
    </aside>
  )
}

export default FilterSidebar
