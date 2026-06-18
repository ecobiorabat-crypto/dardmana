import type { HTMLAttributes, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export type BadgeVariant = 'new' | 'bestseller' | 'sale' | 'limited' | 'outofstock'

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  variant?: BadgeVariant
  /** Remplace le libellé par défaut du variant. */
  children?: ReactNode
  className?: string
}

interface BadgeConfig {
  labelKey: string
  /** Classes Tailwind (couleurs via variables CSS uniquement). */
  className: string
}

const CONFIG: Record<BadgeVariant, BadgeConfig> = {
  new: {
    labelKey: 'Products.new',
    className: 'bg-[var(--vert-moyen)] text-[var(--blanc)]',
  },
  bestseller: {
    labelKey: 'Products.bestseller',
    className: 'bg-[var(--or-royal)] text-[var(--noir)]',
  },
  sale: {
    labelKey: 'Products.sale',
    className: 'bg-[var(--erreur)] text-[var(--blanc)]',
  },
  limited: {
    labelKey: 'Products.limited',
    className:
      'bg-transparent text-[var(--vert-fonce)] border border-[var(--or-royal)]',
  },
  outofstock: {
    labelKey: 'Products.soldOut',
    className: 'bg-[var(--gris-perle)] text-[var(--texte-doux)]',
  },
}

export function Badge({ variant = 'new', children, className, ...rest }: BadgeProps) {
  const t = useTranslations()
  const config = CONFIG[variant]

  return (
    <span
      data-variant={variant}
      className={cn(
        'inline-flex items-center justify-center',
        'font-corps font-medium uppercase',
        'text-[0.625rem] leading-none tracking-[0.16em]',
        'px-2.5 py-1 rounded-none',
        config.className,
        className,
      )}
      {...rest}
    >
      {children ?? t(config.labelKey)}
    </span>
  )
}

export default Badge
