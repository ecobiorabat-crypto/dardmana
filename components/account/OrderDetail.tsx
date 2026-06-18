'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { formatMad } from '@/lib/utils/price'
import { orderStatusMeta, trackingUrl } from '@/lib/utils/order-status'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

interface OrderItem {
  id: string
  productName: string
  productImage: string
  quantity: number
  unitPriceMad: number | string
  totalMad: number | string
}

interface StatusHistory {
  id: string
  status: string
  note: string | null
  createdAt: string
}

interface ShippingAddress {
  fullName?: string
  phone?: string
  addressLine1?: string
  city?: string
  postalCode?: string
  country?: string
}

interface OrderFull {
  id: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  subtotalMad: number | string
  shippingCostMad: number | string
  discountMad: number | string
  totalMad: number | string
  trackingNumber: string | null
  carrier: string | null
  createdAt: string
  shippingAddress: ShippingAddress
  orderItems: OrderItem[]
  statusHistory: StatusHistory[]
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const t = useTranslations()
  const locale = useCurrentLocale()
  const [order, setOrder] = useState<OrderFull | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/orders/${orderId}`, { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? t('OrderDetail.notFound'))
        return d
      })
      .then((d) => setOrder(d.order))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message)
      })
    return () => controller.abort()
  }, [orderId])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <p className="font-titre text-2xl text-[var(--vert-fonce)]">{error}</p>
        <Button href={localizedHref(locale, '/compte')} variant="outline" size="md">
          {t('OrderDetail.backToAccount')}
        </Button>
      </div>
    )
  }

  if (!order) {
    return <Skeleton variant="card" />
  }

  const meta = orderStatusMeta(order.orderStatus)
  const track = trackingUrl(order.carrier, order.trackingNumber)
  const addr = order.shippingAddress ?? {}

  return (
    <div>
      <Link
        href={localizedHref(locale, '/compte')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]"
      >
        <svg className="rtl-flip h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('OrderDetail.backToOrders')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl text-[var(--vert-fonce)]">
          {t('OrderDetail.orderTitle', { number: order.orderNumber })}
        </h1>
        <span className="flex items-center gap-1.5 text-sm" style={{ color: meta.color }}>
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          {t(`OrderStatus.${order.orderStatus}`)}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--texte-doux)]">
        {t('OrderDetail.placedOn', { date: new Date(order.createdAt).toLocaleDateString('fr-FR') })}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {/* Produits */}
          <section>
            <h2 className="mb-4 font-titre text-xl text-[var(--texte)]">{t('OrderDetail.items')}</h2>
            <ul className="divide-y divide-[var(--bordure)] border-y border-[var(--bordure)]">
              {order.orderItems.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {it.productImage ? (
                      <Image src={it.productImage} alt={it.productName} fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--texte)]">{it.productName}</p>
                    <p className="text-xs text-[var(--texte-doux)]">× {it.quantity}</p>
                  </div>
                  <span className="text-sm">{formatMad(Number(it.totalMad))}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Timeline */}
          {order.statusHistory.length > 0 && (
            <section>
              <h2 className="mb-4 font-titre text-xl text-[var(--texte)]">{t('OrderDetail.timeline')}</h2>
              <ol className="relative space-y-5 border-s border-[var(--bordure)] ps-6">
                {order.statusHistory.map((h) => {
                  const m = orderStatusMeta(h.status)
                  return (
                    <li key={h.id} className="relative">
                      <span
                        className="absolute -start-[1.65rem] top-1 h-3 w-3 rounded-full ring-4 ring-[var(--background)]"
                        style={{ background: m.color }}
                      />
                      <p className="text-sm font-medium text-[var(--texte)]">{t(`OrderStatus.${h.status}`)}</p>
                      {h.note && <p className="text-xs text-[var(--texte-doux)]">{h.note}</p>}
                      <p className="text-xs text-[var(--texte-doux)]">
                        {new Date(h.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>

        {/* Résumé + livraison */}
        <aside className="space-y-6">
          <div className="border border-[var(--bordure)] p-5">
            <h3 className="font-titre text-lg text-[var(--vert-fonce)]">{t('Cart.summary')}</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--texte-doux)]">{t('OrderDetail.subtotal')}</dt>
                <dd>{formatMad(Number(order.subtotalMad))}</dd>
              </div>
              {Number(order.discountMad) > 0 && (
                <div className="flex justify-between text-[var(--vert-moyen)]">
                  <dt>{t('OrderDetail.discount')}</dt>
                  <dd>−{formatMad(Number(order.discountMad))}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[var(--texte-doux)]">{t('OrderDetail.shipping')}</dt>
                <dd>{Number(order.shippingCostMad) === 0 ? t('OrderDetail.shippingFree') : formatMad(Number(order.shippingCostMad))}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--bordure)] pt-2 text-base">
                <dt className="font-medium">{t('OrderDetail.total')}</dt>
                <dd className="font-titre text-lg text-[var(--vert-fonce)]">{formatMad(Number(order.totalMad))}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-[var(--bordure)] p-5 text-sm">
            <h3 className="font-titre text-lg text-[var(--vert-fonce)]">{t('OrderDetail.shipping')}</h3>
            <p className="mt-3 text-[var(--texte)]">{addr.fullName}</p>
            <p className="text-[var(--texte-doux)]">
              {addr.addressLine1}, {addr.city} {addr.postalCode}
            </p>
            <p className="text-[var(--texte-doux)]">{addr.country}</p>

            {order.trackingNumber && (
              <div className="mt-4 border-t border-[var(--bordure)] pt-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">
                  {t('OrderDetail.tracking')}{order.carrier ? ` · ${order.carrier}` : ''}
                </p>
                <p className="mt-1 font-medium text-[var(--texte)]">{order.trackingNumber}</p>
                {track && (
                  <a
                    href={track}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--vert-fonce)] underline-offset-2 hover:underline"
                  >
                    {t('OrderDetail.trackPackage')}
                    <svg className="rtl-flip h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default OrderDetail
