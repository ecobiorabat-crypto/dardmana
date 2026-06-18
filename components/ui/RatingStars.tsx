'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export interface RatingStarsProps {
  /** Note de 0 à 5 (décimales acceptées en lecture). */
  rating: number
  reviewCount?: number
  interactive?: boolean
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

function StarShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.9l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.5z" />
    </svg>
  )
}

export function RatingStars({
  rating,
  reviewCount,
  interactive = false,
  onChange,
  size = 'md',
  className,
}: RatingStarsProps) {
  const t = useTranslations()
  const [hovered, setHovered] = useState<number | null>(null)
  const clamped = Math.max(0, Math.min(5, rating))
  const display = hovered ?? clamped
  const starSize = SIZES[size]

  const handleSelect = (value: number) => {
    if (interactive) onChange?.(value)
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className="inline-flex items-center gap-0.5"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={
          interactive
            ? t('Products.selectRating')
            : t('Products.ratingValue', { value: clamped.toFixed(1) })
        }
        onMouseLeave={() => interactive && setHovered(null)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const fraction = Math.max(0, Math.min(1, display - i))
          const value = i + 1
          const star = (
            <span className={cn('relative inline-block', starSize)}>
              <StarShape className={cn(starSize, 'absolute inset-0 text-[var(--gris-perle)]')} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fraction * 100}%` }}
              >
                <StarShape className={cn(starSize, 'text-[var(--or-royal)]')} />
              </span>
            </span>
          )

          if (!interactive) return <span key={i}>{star}</span>

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={Math.round(clamped) === value}
              aria-label={t('Products.starCount', { count: value })}
              onMouseEnter={() => setHovered(value)}
              onFocus={() => setHovered(value)}
              onBlur={() => setHovered(null)}
              onClick={() => handleSelect(value)}
              className={cn(
                'cursor-pointer leading-none transition-transform duration-150 hover:scale-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
              )}
            >
              {star}
            </button>
          )
        })}
      </div>

      {typeof reviewCount === 'number' && (
        <span className="text-xs text-[var(--texte-doux)]">
          ({t('Products.reviewsCount', { count: reviewCount })})
        </span>
      )}
    </div>
  )
}

export default RatingStars
