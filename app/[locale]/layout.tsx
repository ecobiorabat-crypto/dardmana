import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { prisma } from '@/lib/prisma'
import { getSiteSettings } from '@/lib/settings'
import { getHomepageSettings } from '@/lib/homepage'
import { pickLocale } from '@/lib/cms'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CursorEffect } from '@/components/layout/CursorEffect'
import { UnavailableNotice } from '@/components/layout/UnavailableNotice'
import { Toast } from '@/components/ui/Toast'
import { MetaPixel } from '@/components/analytics/MetaPixel'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID

const SITE_NAME = 'Dar Dmana — Artisanat Marocain Authentique'

const DESCRIPTIONS: Record<string, string> = {
  fr: "Première marque marocaine de chapelets artisanaux. Bois d'olivier, oud salib, oud anab — faits main au Maroc. Livraison 24h.",
  ar: 'أول علامة مغربية للسبح المصنوعة يدويًا. خشب الزيتون، عود الصليب، عود العناب — صناعة يدوية بالمغرب. توصيل خلال 24 ساعة.',
  en: "Morocco's leading handmade prayer-bead (tasbih) brand. Olive wood, oud salib, oud anab — handcrafted in Morocco. 24h delivery.",
}

const KEYWORDS = [
  'chapelet marocain',
  'سبحة',
  'rosaire artisanal',
  'oud salib',
  'dar dmana',
  'artisanat maroc',
  'tasbih',
  'oud anab',
]

const OG_LOCALE: Record<string, string> = { fr: 'fr_FR', ar: 'ar_MA', en: 'en_US' }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.fr
  const url = `${SITE_URL}/${locale}`

  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = `${SITE_URL}/${l}`
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}`

  return {
    title: {
      default: SITE_NAME,
      template: '%s | Dar Dmana — Artisanat Marocain Authentique',
    },
    description,
    keywords: KEYWORDS,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      siteName: 'Dar Dmana',
      locale: OG_LOCALE[locale] ?? 'fr_FR',
      url,
      title: SITE_NAME,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@dar_dmana_tassebih',
      title: SITE_NAME,
      description,
    },
    ...(FB_APP_ID && { other: { 'fb:app_id': FB_APP_ID } }),
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }
  setRequestLocale(locale)
  const messages = await getMessages()
  const t = await getTranslations()
  const [settings, homepage, limitedCount] = await Promise.all([
    getSiteSettings(),
    getHomepageSettings(),
    prisma.product.count({ where: { status: 'ACTIVE', tags: { has: 'limited' } } }).catch(() => 0),
  ])
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  // Bandeau : message auto « éditions limitées » prioritaire si elles existent,
  // sinon l'annonce admin (si activée).
  const announcement = pickLocale(homepage, 'announcementText', locale)
  const limitedMsg = limitedCount > 0 ? t('Announcement.limitedEditions', { count: limitedCount }) : null
  const showAnnouncement = Boolean(limitedMsg) || homepage.announcementActive

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} dir={dir} className="flex min-h-screen flex-col">
        <div className="fixed inset-x-0 top-0 z-[100]">
          {showAnnouncement && (
            <AnnouncementBar
              message={limitedMsg ?? announcement ?? undefined}
              cookieKey={limitedMsg ? `dd-limited-${limitedCount}` : 'dd-announcement'}
            />
          )}
          <Navbar logoUrl={settings.logoUrl} siteName={settings.siteName} navConfig={settings.navConfig} />
        </div>

        <main className="flex flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </main>

        <Footer
          logoUrl={settings.logoUrl}
          siteName={settings.siteName}
          phone={settings.phone}
          email={settings.email}
          address={settings.address}
          navConfig={settings.navConfig}
          social={{
            instagram: settings.socialInstagram,
            facebook: settings.socialFacebook,
            tiktok: settings.socialTikTok,
          }}
        />
        <CursorEffect />
        <UnavailableNotice />
        <Toast />
        <MetaPixel />
        <GoogleAnalytics />
      </div>
    </NextIntlClientProvider>
  )
}
