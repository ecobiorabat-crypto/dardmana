import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div className="mx-auto max-w-2xl px-4 pt-32 pb-24 text-center sm:px-6" aria-busy="true" aria-label={t('loading')}>
      <div className="mx-auto dd-shimmer h-20 w-20 rounded-full" aria-hidden="true" />
      <div className="mx-auto mt-7 dd-shimmer h-9 w-72" aria-hidden="true" />
      <div className="mx-auto mt-4 dd-shimmer h-4 w-full max-w-md" aria-hidden="true" />
      <div className="mx-auto mt-8 dd-shimmer h-40 w-full" aria-hidden="true" />
    </div>
  )
}
