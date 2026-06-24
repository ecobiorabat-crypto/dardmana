import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'
import { localizedHref } from '@/lib/utils/locale'
import { getPublishedCmsPage, pickLocale } from '@/lib/cms'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const CMS_SLUG = 'livraison-retours'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Shipping' })
  const url = `${SITE_URL}/${locale}/livraison-retours`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/livraison-retours`
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: url, languages },
    openGraph: { title: `${t('metaTitle')} · Dar Dmana`, description: t('metaDescription'), url, siteName: 'Dar Dmana', type: 'website' },
  }
}

interface Row { zone: string; time: string; price: string }
interface Faq { q: string; a: string }

export default async function LivraisonRetoursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Shipping')

  // Contenu géré via CMS si publié, sinon contenu structuré ci-dessous.
  const cms = await getPublishedCmsPage(CMS_SLUG)
  if (cms) {
    return (
      <div className="pb-20">
        <section className="bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)] px-4 pt-28 pb-14 text-center sm:px-6 lg:pt-32">
          <h1 className="font-titre text-4xl text-[var(--creme)] sm:text-5xl">{pickLocale(cms, 'title', locale)}</h1>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal><Markdown content={pickLocale(cms, 'content', locale)} /></Reveal>
        </section>
      </div>
    )
  }

  const rows = t.raw('rows') as Row[]
  const faq = t.raw('faq') as Faq[]

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)] px-4 pt-28 pb-14 text-center sm:px-6 lg:pt-32">
        <Reveal direction="up">
          <h1 className="font-titre text-4xl text-[var(--creme)] sm:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--creme)]/85">{t('subtitle')}</p>
        </Reveal>
      </section>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-14 sm:px-6 lg:px-8">
        {/* Délais de livraison */}
        <Reveal>
          <section>
            <h2 className="mb-5 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">{t('delaysTitle')}</h2>
            <div className="overflow-x-auto border border-[var(--bordure)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--bordure)] bg-[var(--gris-perle)]/40 text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                    <th className="px-4 py-3 font-medium">{t('colZone')}</th>
                    <th className="px-4 py-3 font-medium">{t('colTime')}</th>
                    <th className="px-4 py-3 font-medium">{t('colPrice')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--bordure)] last:border-0">
                      <td className="px-4 py-3 font-medium text-[var(--texte)]">{r.zone}</td>
                      <td className="px-4 py-3 text-[var(--texte-doux)]">{r.time}</td>
                      <td className="px-4 py-3 text-[var(--texte-doux)]">{r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>

        {/* Politique de retours */}
        <Reveal>
          <section>
            <h2 className="mb-5 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">{t('returnsTitle')}</h2>
            <dl className="space-y-4">
              {[
                [t('returnDelayLabel'), t('returnDelay')],
                [t('returnConditionsLabel'), t('returnConditions')],
                [t('returnHowLabel'), t('returnHow')],
                [t('returnRefundLabel'), t('returnRefund')],
              ].map(([label, value], i) => (
                <div key={i} className="border-s-2 border-[var(--or-royal)] ps-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--vert-fonce)]">{label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[var(--texte-doux)]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
          <section>
            <h2 className="mb-5 font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">{t('faqTitle')}</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details key={i} className="group border border-[var(--bordure)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--texte)] marker:hidden">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--texte-doux)]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>

        {/* CTA */}
        <Reveal>
          <section className="bg-[var(--vert-fonce)] px-8 py-12 text-center">
            <h2 className="font-titre text-2xl text-[var(--creme)] sm:text-3xl">{t('ctaTitle')}</h2>
            <div className="mt-6 flex justify-center">
              <Button href={localizedHref(locale, '/contact')} variant="gold" size="md">
                {t('ctaButton')}
              </Button>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  )
}
