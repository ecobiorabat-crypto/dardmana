import type { Metadata } from 'next'
import { ensurePageEnabled } from "@/lib/nav-config"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'
import { Markdown } from '@/components/ui/Markdown'
import { FaqAccordion } from '@/components/faq/FaqAccordion'
import { getPublishedCmsPage, pickLocale } from '@/lib/cms'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const CMS_SLUG = 'faq'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Faq' })
  const url = `${SITE_URL}/${locale}/faq`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/faq`
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: { title: `${t('metaTitle')} · Dar Dmana`, description: t('metaDescription'), url, siteName: 'Dar Dmana', type: 'website' },
  }
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await ensurePageEnabled("faq", locale)
  const t = await getTranslations('Faq')

  // Contenu géré via CMS si publié, sinon accordéon structuré.
  const cms = await getPublishedCmsPage(CMS_SLUG)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-10 text-center">
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
          {cms ? pickLocale(cms, 'title', locale) : t('title')}
        </h1>
        {!cms && (
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--texte-doux)]">{t('subtitle')}</p>
        )}
      </header>

      {cms ? (
        <Reveal>
          <Markdown content={pickLocale(cms, 'content', locale)} />
        </Reveal>
      ) : (
        <FaqAccordion />
      )}
    </div>
  )
}
