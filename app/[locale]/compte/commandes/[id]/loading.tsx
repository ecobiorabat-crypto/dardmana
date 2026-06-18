import { Skeleton } from '@/components/ui/Skeleton'
import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div
      className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <div className="mb-6 dd-shimmer h-4 w-40" aria-hidden="true" />
      <div className="mb-8 dd-shimmer h-9 w-72" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  )
}
