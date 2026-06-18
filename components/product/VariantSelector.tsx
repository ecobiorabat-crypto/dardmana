'use client'

import { useTranslations } from 'next-intl'
import { pickLocale } from '@/lib/utils/product'
import { cn } from '@/lib/utils/cn'

export interface VariantOption {
  id: string
  nameFr: string
  nameAr: string
  nameEn: string
  priceMad: number | string
  stock: number
}

export interface VariantSelectorProps {
  variants: VariantOption[]
  value?: string
  onChange: (variantId: string) => void
  locale: string
  label?: string
  className?: string
}

/** Sélecteur de variantes (taille, couleur…) sous forme de pastilles. */
export function VariantSelector({
  variants,
  value,
  onChange,
  locale,
  label,
  className,
}: VariantSelectorProps) {
  const t = useTranslations()
  if (variants.length === 0) return null

  const groupLabel = label ?? t('Products.selectVariant')

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--texte)]">
        {groupLabel}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={groupLabel}>
        {variants.map((v) => {
          const vName = pickLocale({ fr: v.nameFr, ar: v.nameAr, en: v.nameEn }, locale)
          const active = v.id === value
          const disabled = v.stock <= 0
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                'border px-4 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
                active
                  ? 'border-[var(--vert-fonce)] bg-[var(--vert-fonce)] text-[var(--creme)]'
                  : 'border-[var(--bordure)] text-[var(--texte)] hover:border-[var(--or-royal)]',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {vName}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default VariantSelector
