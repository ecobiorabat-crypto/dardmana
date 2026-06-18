import { getTranslations } from 'next-intl/server'

export default async function Loading() {
  const t = await getTranslations('Common')
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center pt-28">
      <span
        aria-label={t('loading')}
        role="status"
        className="inline-block h-10 w-10 rounded-full border-2 border-[var(--or-royal)] border-t-transparent [animation:dd-spin_0.8s_linear_infinite] motion-reduce:animate-none"
      />
    </div>
  )
}
