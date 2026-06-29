import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

/** Motif décoratif marocain — étoile à 8 branches (khatim) dorée. */
function MoroccanStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d="M50 4 61 28 87 24 73 46 96 58 70 64 74 90 52 76 30 90 34 64 8 58 31 46 17 24 43 28Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="50" cy="52" r="20" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <circle cx="50" cy="52" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}

export default async function LocaleNotFound() {
  const locale = await getLocale()
  const t = await getTranslations('Errors')
  const tc = await getTranslations('Cart')

  return (
    <div className="mx-auto flex min-h-[78vh] max-w-2xl flex-col items-center justify-center px-4 pt-32 pb-20 text-center">
      <div className="relative mb-6 text-[var(--or-royal)]">
        <MoroccanStar className="h-28 w-28" />
        <span className="absolute inset-0 flex items-center justify-center font-titre text-2xl tracking-[0.2em] text-[var(--vert-fonce)]">
          404
        </span>
      </div>

      <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">{t('notFound')}</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--texte-doux)]">
        {t('notFoundText')}
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/${locale}`}
          className="inline-flex h-12 items-center justify-center bg-[var(--vert-fonce)] px-7 text-xs font-medium uppercase tracking-[0.14em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)]"
        >
          {t('backHome')}
        </Link>
        <Link
          href={`/${locale}/catalogue`}
          className="inline-flex h-12 items-center justify-center border border-[var(--vert-fonce)] px-7 text-xs font-medium uppercase tracking-[0.14em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
        >
          {tc('discoverCatalogue')}
        </Link>
      </div>
    </div>
  )
}
