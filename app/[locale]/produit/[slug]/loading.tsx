import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div
      className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-28"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <div className="mb-8 dd-shimmer h-3 w-48" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[55fr_45fr] lg:gap-14">
        <div className="dd-shimmer aspect-[3/4] w-full" aria-hidden="true" />
        <div className="space-y-5">
          <div className="dd-shimmer h-4 w-24" aria-hidden="true" />
          <div className="dd-shimmer h-9 w-3/4" aria-hidden="true" />
          <div className="dd-shimmer h-4 w-32" aria-hidden="true" />
          <div className="dd-shimmer h-8 w-40" aria-hidden="true" />
          <div className="dd-shimmer h-20 w-full" aria-hidden="true" />
          <div className="dd-shimmer h-12 w-full" aria-hidden="true" />
          <div className="dd-shimmer h-12 w-full" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
