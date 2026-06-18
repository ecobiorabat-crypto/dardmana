import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/settings'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'
import { CursorEffect } from '@/components/layout/CursorEffect'
import { Toast } from '@/components/ui/Toast'
import { MetaPixel } from '@/components/analytics/MetaPixel'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

export const metadata: Metadata = {
  title: {
    default: 'Dar Dmana — Maison de luxe marocaine',
    template: '%s · Dar Dmana',
  },
  description:
    'Dar Dmana — l\u2019artisanat marocain réinventé. Créations d\u2019exception, élégance intemporelle.',
  openGraph: {
    type: 'website',
    siteName: 'Dar Dmana',
  },
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
  const settings = await getSiteSettings()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} dir={dir} className="flex min-h-screen flex-col">
        <div className="fixed inset-x-0 top-0 z-[100]">
          <AnnouncementBar />
          <Navbar logoUrl={settings.logoUrl} siteName={settings.siteName} />
        </div>

        <main className="flex flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </main>

        <Footer logoUrl={settings.logoUrl} siteName={settings.siteName} />
        <CursorEffect />
        <Toast />
        <MetaPixel />
        <GoogleAnalytics />
      </div>
    </NextIntlClientProvider>
  )
}
