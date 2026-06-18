import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { OrderDetail } from '@/components/account/OrderDetail'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return {
    title: t('OrderDetail.title'),
    robots: { index: false },
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)

  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-32">
      <OrderDetail orderId={id} />
    </div>
  )
}
