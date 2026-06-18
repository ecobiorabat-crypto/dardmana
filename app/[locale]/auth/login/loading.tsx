import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 pt-28 pb-16" aria-busy="true" aria-label={t('loading')}>
      <div className="dd-shimmer mx-auto h-9 w-56" aria-hidden="true" />
      <div className="mt-8 space-y-5">
        <div className="dd-shimmer h-12 w-full" aria-hidden="true" />
        <div className="dd-shimmer h-12 w-full" aria-hidden="true" />
        <div className="dd-shimmer h-12 w-full" aria-hidden="true" />
      </div>
    </div>
  )
}
