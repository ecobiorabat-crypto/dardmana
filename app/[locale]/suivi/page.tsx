import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { OrderTrackForm } from '@/components/tracking/OrderTrackForm'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Tracking' })
  const url = `${SITE_URL}/${locale}/suivi`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/suivi`

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: { title: `${t('metaTitle')} · Dar Dmana`, description: t('metaDescription'), url, siteName: 'Dar Dmana', type: 'website' },
  }
}

export default async function SuiviPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Tracking')

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-10 text-center">
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--texte-doux)]">{t('subtitle')}</p>
      </header>

      <OrderTrackForm />
    </div>
  )
}
