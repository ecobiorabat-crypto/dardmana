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
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[var(--bordure)] pb-6">
              <div className="dd-shimmer h-28 w-24 shrink-0" aria-hidden="true" />
              <div className="flex-1 space-y-3">
                <div className="dd-shimmer h-4 w-2/3" aria-hidden="true" />
                <div className="dd-shimmer h-4 w-24" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
        <div className="dd-shimmer h-72 w-full" aria-hidden="true" />
      </div>
    </div>
  )
}
