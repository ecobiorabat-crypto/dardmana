import { Skeleton } from '@/components/ui/Skeleton'
import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div aria-busy="true" aria-label={t('loading')}>
      <div className="dd-shimmer h-56 w-full" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <div className="hidden space-y-6 lg:block">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dd-shimmer h-28 w-full" aria-hidden="true" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="product" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
