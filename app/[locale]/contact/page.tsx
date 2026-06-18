import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactForm } from '@/components/contact/ContactForm'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
// Numéro WhatsApp (format international sans +, espaces ni tirets).
const WHATSAPP_NUMBER = '212600000000'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })
  const url = `${SITE_URL}/${locale}/contact`
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}/contact`

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

const ICONS = {
  pin: (
    <>
      <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  phone: (
    <path d="M5 4h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  ),
  whatsapp: (
    <path d="M4 20l1.3-3.8A7.5 7.5 0 1118.5 19a7.6 7.6 0 01-5.5 1.1L4 20z M9 9.5c0 4 3 6 5.5 6 .8 0 1.5-.6 1.7-1.2.1-.3 0-.5-.2-.6l-1.5-.7c-.2-.1-.4 0-.6.2l-.4.5c-1-.4-1.8-1.2-2.2-2.2l.5-.4c.2-.2.3-.4.2-.6l-.7-1.5c-.1-.2-.3-.3-.6-.2-.6.2-1.2.9-1.2 1.7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--or-royal)] text-[var(--or-royal)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <div>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--texte-doux)]">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[var(--texte)]">{children}</div>
      </div>
    </div>
  )
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Contact')

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <header className="mb-12 max-w-2xl">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
          {t('eyebrow')}
        </p>
        <h1 className="font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">{t('title')}</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--texte-doux)]">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        {/* Formulaire */}
        <div>
          <h2 className="mb-8 font-titre text-2xl text-[var(--vert-fonce)]">{t('formTitle')}</h2>
          <ContactForm />
        </div>

        {/* Colonne info */}
        <aside className="lg:border-s lg:border-[var(--bordure)] lg:ps-12">
          <h2 className="mb-2 font-titre text-2xl text-[var(--vert-fonce)]">{t('infoTitle')}</h2>
          <p className="mb-8 text-sm text-[var(--texte-doux)]">{t('infoSubtitle')}</p>

          <div className="space-y-6">
            <InfoRow icon={ICONS.pin} label={t('addressLabel')}>
              {t('addressValue')}
            </InfoRow>

            <InfoRow icon={ICONS.phone} label={t('phoneLabel')}>
              <a
                href={`tel:${t('phoneValue').replace(/[^+\d]/g, '')}`}
                className="transition-colors hover:text-[var(--vert-fonce)]"
              >
                {t('phoneValue')}
              </a>
            </InfoRow>

            <InfoRow icon={ICONS.whatsapp} label={t('whatsappLabel')}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--vert-fonce)] underline-offset-2 transition-colors hover:text-[var(--or-royal)] hover:underline"
              >
                {t('whatsappValue')}
              </a>
            </InfoRow>

            <InfoRow icon={ICONS.mail} label={t('emailLabel')}>
              <a
                href={`mailto:${t('emailValue')}`}
                className="transition-colors hover:text-[var(--vert-fonce)]"
              >
                {t('emailValue')}
              </a>
            </InfoRow>

            <InfoRow icon={ICONS.clock} label={t('hoursLabel')}>
              {t('hoursValue')}
            </InfoRow>
          </div>

          {/* Placeholder carte */}
          <div className="mt-8 hidden aspect-[4/3] w-full overflow-hidden border border-[var(--bordure)] lg:block">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--gris-perle)] to-[var(--creme)]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--or-royal)] text-[var(--or-royal)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {ICONS.pin}
                </svg>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
