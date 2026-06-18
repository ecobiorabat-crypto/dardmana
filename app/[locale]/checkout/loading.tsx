import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div
      className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="dd-shimmer h-8 w-full" aria-hidden="true" />
          <div className="dd-shimmer h-7 w-48" aria-hidden="true" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="dd-shimmer h-12 w-full" aria-hidden="true" />
          ))}
        </div>
        <div className="dd-shimmer h-80 w-full" aria-hidden="true" />
      </div>
    </div>
  )
}
