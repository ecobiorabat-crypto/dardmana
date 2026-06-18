'use client'

import { useTranslations } from 'next-intl'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils/cn'

export interface StockIndicatorProps {
  /** Stock disponible. */
  stock: number
  /** Seuil à partir duquel l'indicateur visuel s'affiche. */
  threshold?: number
  className?: string
}

/**
 * Indicateur de stock : barre de progression colorée (vert → orange → rouge)
 * accompagnée d'un libellé ("Plus que X en stock"). Masqué lorsque le stock
 * est confortable, affiche un message dédié en cas de rupture.
 */
export function StockIndicator({ stock, threshold = 10, className }: StockIndicatorProps) {
  const t = useTranslations()
  if (stock <= 0) {
    return (
      <p className={cn('text-sm font-medium text-[var(--erreur)]', className)} role="status">
        {t('Products.outOfStock')}
      </p>
    )
  }

  if (stock >= threshold) return null

  return (
    <div className={className}>
      <ProgressBar value={stock} max={threshold} />
    </div>
  )
}

export default StockIndicator
