'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useHydrated } from '@/components/layout/hooks'
import { formatMad } from '@/lib/utils/price'
import { trackPurchase } from '@/lib/analytics/events'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

interface OrderSummary {
  orderNumber: string
  items: { productId?: string; name: string; quantity: number; priceMad: number; image: string }[]
  subtotal: number
  shippingCost: number
  total: number
  shipping: string
  estimatedDays: string
  paymentMethod: string
}

function readSummary(): OrderSummary | null {
  try {
    const raw = sessionStorage.getItem('dd-last-order')
    return raw ? (JSON.parse(raw) as OrderSummary) : null
  } catch {
    return null
  }
}

export function ConfirmationContent() {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? ''
  const summary = hydrated ? readSummary() : null

  // Événement analytics « achat » — une fois, après commande réussie.
  const purchaseFired = useRef(false)
  useEffect(() => {
    if (purchaseFired.current || !hydrated || !orderNumber || !summary) return
    purchaseFired.current = true
    trackPurchase({
      orderNumber,
      total: summary.total,
      items: summary.items.map((i) => ({
        id: i.productId ?? i.name,
        name: i.name,
        price: i.priceMad,
        quantity: i.quantity,
      })),
    })
  }, [hydrated, orderNumber, summary])

  return (
    <div className="mx-auto max-w-2xl px-4 pt-32 pb-24 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--vert-fonce)]"
      >
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-[var(--or-clair)]"
        >
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          />
        </motion.svg>
      </motion.div>

      <h1 className="mt-7 font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
        {t('Confirmation.thankYou')}
      </h1>
      <p className="mt-3 text-sm text-[var(--texte-doux)]">
        {t('Confirmation.subtitle')}
      </p>

      {orderNumber && (
        <p className="mt-6 inline-block border border-[var(--bordure)] bg-[var(--creme)] px-5 py-3">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--texte-doux)]">{t('Confirmation.orderNumber')}</span>
          <br />
          <span className="font-titre text-2xl text-[var(--vert-fonce)]">{orderNumber}</span>
        </p>
      )}

      {summary && (
        <div className="mt-8 border border-[var(--bordure)] p-6 text-start">
          <ul className="space-y-3">
            {summary.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                  {i.image ? (
                    <Image src={i.image} alt={i.name} fill sizes="40px" className="object-cover" />
                  ) : null}
                </div>
                <span className="flex-1 truncate text-sm text-[var(--texte)]">{i.name}</span>
                <span className="text-xs text-[var(--texte-doux)]">× {i.quantity}</span>
                <span className="text-sm">{formatMad(i.priceMad * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-[var(--bordure)] pt-4 text-sm">
            <div className="flex justify-between text-[var(--texte-doux)]">
              <dt>{`${t('Checkout.stepShipping')} (${summary.shipping})`}</dt>
              <dd>{summary.shippingCost === 0 ? t('Common.offered') : formatMad(summary.shippingCost)}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-medium">{t('Cart.total')}</dt>
              <dd className="font-titre text-lg text-[var(--vert-fonce)]">{formatMad(summary.total)}</dd>
            </div>
          </dl>
          {summary.estimatedDays && (
            <p className="mt-4 text-xs text-[var(--texte-doux)]">
              {`${t('Confirmation.estimatedDelivery')} : ${summary.estimatedDays}`}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href={localizedHref(locale, '/compte')} variant="dark" size="md">
          {t('Confirmation.trackOrder')}
        </Button>
        <Button href={localizedHref(locale, '/catalogue')} variant="outline" size="md">
          {t('Confirmation.continueShopping')}
        </Button>
      </div>
    </div>
  )
}

export default ConfirmationContent
