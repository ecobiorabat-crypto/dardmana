import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { localizedHref } from '@/lib/utils/locale'
import { routing } from '@/i18n/routing'
import { getPublishedCmsPage, pickLocale } from '@/lib/cms'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'History' })
  const url = `${SITE_URL}/${locale}/notre-histoire`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/notre-histoire`

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: {
      title: `${t('metaTitle')} · Dar Dmana`,
      description: t('metaDescription'),
      url,
      siteName: 'Dar Dmana',
      type: 'website',
    },
  }
}

// Icônes (24x24, stroke currentColor) pour les étapes savoir-faire et valeurs.
const ICONS = {
  leaf: (
    <path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14-2 0-2-2-2-2zm0 0C9 15 12 12 16 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  hand: (
    <path d="M7 11V5.5a1.5 1.5 0 013 0V11m0 0V4.5a1.5 1.5 0 013 0V11m0 0V6.5a1.5 1.5 0 013 0V13c0 4-2.5 7-6.5 7S6 17 5 14l-1-2.5c-.5-1 .5-2 1.5-1.5L7 11z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  shield: (
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-2.5 9l1.8 1.8L15 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  ),
  box: (
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5L4 7.5m16 0L12 12 4 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  ),
  sparkle: (
    <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  ),
  gem: (
    <path d="M6 4h12l3 5-9 11L3 9l3-5zm-3 5h18M8 4l-2 5 6 11m4-16l2 5-6 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
}

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--or-royal)] text-[var(--or-royal)]">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

export default async function NotreHistoirePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('History')

  // Contenu géré via l'admin (CMS). Si la page est publiée, on l'affiche ;
  // sinon on retombe sur le contenu éditorial intégré ci-dessous.
  const cms = await getPublishedCmsPage('notre-histoire')
  if (cms) {
    const title = pickLocale(cms, 'title', locale)
    const content = pickLocale(cms, 'content', locale)
    return (
      <div className="pb-20">
        <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-4 pt-28 pb-16 text-center sm:px-6 lg:pt-32">
          {/* Image principale gérée via l'admin, sinon dégradé par défaut. */}
          {cms.heroImageUrl ? (
            <>
              <Image
                src={cms.heroImageUrl}
                alt={title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[var(--vert-fonce)]/70" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)]" />
          )}
          <Reveal direction="up" className="relative z-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-[var(--or-clair)]">
              {t('heroEyebrow')}
            </p>
            <h1 className="font-titre text-5xl text-[var(--creme)] sm:text-6xl">{title}</h1>
          </Reveal>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <Reveal>
            <Markdown content={content} />
          </Reveal>
        </section>

        {/* Galerie « Nos artisans / savoir-faire » — images gérées via l'admin. */}
        {cms.galleryImages.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
            <Reveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {cms.galleryImages.map((src, i) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden bg-[var(--gris-perle)]">
                    <Image
                      src={src}
                      alt={`${title} — Dar Dmana ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="bg-[var(--vert-fonce)] px-8 py-16 text-center">
              <h2 className="mx-auto max-w-2xl font-titre text-3xl text-[var(--creme)] sm:text-4xl">
                {t('ctaTitle')}
              </h2>
              <div className="mt-8 flex justify-center">
                <Button href={localizedHref(locale, '/collections')} variant="gold" size="lg">
                  {t('ctaButton')}
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    )
  }

  const craftSteps = [
    { icon: ICONS.leaf, title: t('craft1Title'), desc: t('craft1Desc') },
    { icon: ICONS.hand, title: t('craft2Title'), desc: t('craft2Desc') },
    { icon: ICONS.shield, title: t('craft3Title'), desc: t('craft3Desc') },
    { icon: ICONS.box, title: t('craft4Title'), desc: t('craft4Desc') },
  ]

  const values = [
    { icon: ICONS.sparkle, title: t('value1Title'), desc: t('value1Desc') },
    { icon: ICONS.gem, title: t('value2Title'), desc: t('value2Desc') },
    { icon: ICONS.eye, title: t('value3Title'), desc: t('value3Desc') },
  ]

  return (
    <div className="pb-20">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)] px-4 pt-28 pb-16 text-center sm:px-6 lg:pt-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -end-10 -top-10 h-64 w-64 rounded-full border border-[var(--or-clair)]" />
          <div className="absolute -bottom-16 -start-16 h-80 w-80 rounded-full border border-[var(--or-clair)]" />
        </div>
        <Reveal direction="up" className="relative">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-[var(--or-clair)]">
            {t('heroEyebrow')}
          </p>
          <h1 className="font-titre text-5xl text-[var(--creme)] sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--creme)]/85 sm:text-lg">
            {t('heroSubtitle')}
          </p>
        </Reveal>
      </section>

      {/* ── Nos origines ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="right">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
                {t('originsEyebrow')}
              </p>
              <h2 className="font-titre text-3xl leading-tight text-[var(--vert-fonce)] sm:text-4xl">
                {t('originsTitle')}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--texte-doux)]">
                {t('originsBody1')}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--texte-doux)]">
                {t('originsBody2')}
              </p>
            </div>
          </Reveal>

          <Reveal direction="left">
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-titre text-6xl text-[var(--or-clair)]/30">Dar Dmana</span>
              </div>
              <div className="absolute -bottom-6 -end-6 hidden h-32 w-32 border border-[var(--or-royal)] sm:block" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Notre savoir-faire ── */}
      <section className="bg-[var(--gris-perle)]/40 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
                {t('craftEyebrow')}
              </p>
              <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
                {t('craftTitle')}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--texte-doux)]">
                {t('craftSubtitle')}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {craftSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="text-center">
                  <div className="mb-5 flex justify-center">
                    <Glyph>{step.icon}</Glyph>
                  </div>
                  <h3 className="font-titre text-xl text-[var(--vert-fonce)]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--texte-doux)]">
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nos valeurs ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
              {t('valuesEyebrow')}
            </p>
            <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
              {t('valuesTitle')}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.1}>
              <div className="flex flex-col items-center border border-[var(--bordure)] px-6 py-10 text-center">
                <div className="mb-5">
                  <Glyph>{value.icon}</Glyph>
                </div>
                <h3 className="font-titre text-2xl text-[var(--vert-fonce)]">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--texte-doux)]">
                  {value.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="bg-[var(--vert-fonce)] px-8 py-16 text-center">
            <h2 className="mx-auto max-w-2xl font-titre text-3xl text-[var(--creme)] sm:text-4xl">
              {t('ctaTitle')}
            </h2>
            <div className="mt-8 flex justify-center">
              <Button href={localizedHref(locale, '/collections')} variant="gold" size="lg">
                {t('ctaButton')}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
