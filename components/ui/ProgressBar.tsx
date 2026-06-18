import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export interface ProgressBarProps {
  /** Quantité actuelle (ex. stock restant). */
  value: number
  /** Quantité de référence (ex. stock initial ou seuil). */
  max?: number
  /** Affiche un libellé textuel au-dessus de la barre. */
  showLabel?: boolean
  /** Remplace le libellé auto ("Plus que X en stock"). */
  label?: string
  className?: string
}

type Level = 'high' | 'medium' | 'low'

function levelFor(ratio: number): Level {
  if (ratio > 0.5) return 'high'
  if (ratio > 0.2) return 'medium'
  return 'low'
}

const FILL: Record<Level, string> = {
  high: 'bg-[var(--vert-moyen)]',
  medium: 'bg-[var(--alerte)]',
  low: 'bg-[var(--erreur)]',
}

const TEXT: Record<Level, string> = {
  high: 'text-[var(--vert-moyen)]',
  medium: 'text-[var(--alerte)]',
  low: 'text-[var(--erreur)]',
}

export function ProgressBar({
  value,
  max = 10,
  showLabel = true,
  label,
  className,
}: ProgressBarProps) {
  const t = useTranslations()
  const safeMax = max > 0 ? max : 1
  const safeValue = Math.max(0, Math.min(value, safeMax))
  const ratio = safeValue / safeMax
  const level = levelFor(ratio)
  const percent = Math.round(ratio * 100)

  const autoLabel =
    safeValue <= 0
      ? t('Products.outOfStock')
      : t('Products.lowStockText', { count: safeValue })

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <p className={cn('mb-1.5 text-xs font-medium', TEXT[level])}>
          {label ?? autoLabel}
        </p>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--gris-perle)]"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label ?? autoLabel}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none',
            FILL[level],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
