import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: t('Checkout.title'),
    robots: { index: false },
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <h1 className="mb-10 font-titre text-4xl text-[var(--vert-fonce)] sm:text-5xl">
        {t('Checkout.heading')}
      </h1>
      <CheckoutWizard />
    </div>
  )
}
