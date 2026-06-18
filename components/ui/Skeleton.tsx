import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export type SkeletonVariant = 'text' | 'image' | 'card' | 'product'

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  variant?: SkeletonVariant
  /** Nombre de lignes pour le variant `text`. */
  lines?: number
  className?: string
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('dd-shimmer rounded-none', className)} />
}

export function Skeleton({
  variant = 'text',
  lines = 3,
  className,
  ...rest
}: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div
        className={cn('flex flex-col gap-2.5', className)}
        aria-hidden="true"
        {...rest}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    )
  }

  if (variant === 'image') {
    return (
      <Shimmer
        className={cn('aspect-square w-full', className)}
        aria-hidden="true"
      />
    )
  }

  if (variant === 'product') {
    return (
      <div
        className={cn('flex flex-col gap-3', className)}
        aria-hidden="true"
        {...rest}
      >
        <Shimmer className="aspect-[3/4] w-full" />
        <Shimmer className="h-2.5 w-16" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-4 w-1/3" />
      </div>
    )
  }

  // card
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border border-[var(--bordure)] bg-[var(--blanc)] p-4',
        className,
      )}
      aria-hidden="true"
      {...rest}
    >
      <Shimmer className="aspect-video w-full" />
      <div className="flex flex-col gap-2.5">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3.5 w-full" />
        <Shimmer className="h-3.5 w-5/6" />
      </div>
    </div>
  )
}

export default Skeleton
