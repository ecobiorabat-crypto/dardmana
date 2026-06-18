import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FavorisView } from '@/components/favoris/FavorisView'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Wishlist' })
  const url = `${SITE_URL}/${locale}/favoris`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/favoris`

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: url, languages },
    robots: { index: false, follow: true },
    openGraph: {
      title: `${t('title')} · Dar Dmana`,
      description: t('subtitle'),
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

export default async function FavorisPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-10">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
          {t('Wishlist.eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
          {t('Wishlist.title')}
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--texte-doux)]">
          {t('Wishlist.subtitle')}
        </p>
      </header>

      <FavorisView />
    </div>
  )
}
