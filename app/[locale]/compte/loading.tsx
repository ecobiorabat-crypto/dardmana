import { Skeleton } from '@/components/ui/Skeleton'
import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div
      className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <div className="mb-10 dd-shimmer h-10 w-56" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dd-shimmer h-9 w-full" aria-hidden="true" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    </div>
  )
}
