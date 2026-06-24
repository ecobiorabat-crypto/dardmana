'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { orderStatusMeta, trackingUrl } from '@/lib/utils/order-status'
import { cn } from '@/lib/utils/cn'

interface TrackedItem {
  name?: string
  quantity?: number
  image?: string
}

interface TrackedOrder {
  orderNumber: string
  customerName: string
  orderStatus: string
  trackingNumber: string | null
  carrier: string | null
  items: TrackedItem[]
  totalMad: number
  currency: string
  createdAt: string
  statusHistory: { status: string; note: string | null; createdAt: string }[]
}

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2.5 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function OrderTrackForm() {
  const t = useTranslations('Tracking')
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  function statusLabel(status: string): string {
    const key = `status.${status}` as const
    const translated = t(key)
    return translated === key ? orderStatusMeta(status).label : translated
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOrder(null)
    if (!orderNumber.trim() || !phone.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`,
      )
      if (res.status === 404) {
        setError(t('notFound'))
      } else if (!res.ok) {
        setError(t('error'))
      } else {
        const data = await res.json()
        setOrder(data.order as TrackedOrder)
      }
    } catch {
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const track = order ? trackingUrl(order.carrier, order.trackingNumber) : null

  return (
    <div className="space-y-8">
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 border border-[var(--bordure)] bg-[var(--blanc)] p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="orderNumber" className={labelCls}>{t('orderNumberLabel')}</label>
          <input id="orderNumber" className={inputCls} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder={t('orderNumberPlaceholder')} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>{t('phoneLabel')}</label>
          <input id="phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phonePlaceholder')} autoComplete="tel" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-[42px] bg-[var(--vert-fonce)] px-6 text-xs font-medium uppercase tracking-[0.12em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {loading ? t('searching') : t('submit')}
        </button>
      </form>

      {error && (
        <div className="border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-4 py-3 text-sm text-[var(--erreur)]">
          {error}
        </div>
      )}

      {/* Résultat */}
      {order && (
        <div className="space-y-6 border border-[var(--bordure)] bg-[var(--blanc)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bordure)] pb-4">
            <div>
              <p className="font-titre text-xl text-[var(--vert-fonce)]">{t('resultFor')} {order.orderNumber}</p>
              <p className="text-xs text-[var(--texte-doux)]">
                {t('orderedOn')} {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
              style={{ color: orderStatusMeta(order.orderStatus).color, background: `color-mix(in srgb, ${orderStatusMeta(order.orderStatus).color} 12%, transparent)` }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: orderStatusMeta(order.orderStatus).color }} />
              {statusLabel(order.orderStatus)}
            </span>
          </div>

          {/* Suivi transporteur */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className={labelCls}>{t('trackingNumber')}</p>
              {order.trackingNumber ? (
                <p className="text-sm font-medium text-[var(--texte)]">
                  {order.trackingNumber}
                  {order.carrier ? <span className="text-[var(--texte-doux)]"> · {order.carrier}</span> : null}
                </p>
              ) : (
                <p className="text-sm text-[var(--texte-doux)]">{t('noTracking')}</p>
              )}
              {track && (
                <a href={track} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[var(--vert-fonce)] underline-offset-2 hover:underline">
                  {t('trackPackage')}
                </a>
              )}
            </div>
          </div>

          {/* Produits */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">{t('items')}</p>
              <ul className="space-y-2">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="h-10 w-9 shrink-0 rounded object-cover" />
                    )}
                    <span className="flex-1 text-[var(--texte)]">{it.name}</span>
                    <span className="text-[var(--texte-doux)]">×{it.quantity ?? 1}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline */}
          {order.statusHistory.length > 0 && (
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">{t('history')}</p>
              <ol className="relative space-y-4 border-s border-[var(--bordure)] ps-5">
                {order.statusHistory.map((h, i) => {
                  const meta = orderStatusMeta(h.status)
                  return (
                    <li key={i} className="relative">
                      <span className={cn('absolute -start-[1.45rem] top-1 h-2.5 w-2.5 rounded-full')} style={{ background: meta.color }} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: meta.color }}>{statusLabel(h.status)}</span>
                        <span className="text-xs text-[var(--texte-doux)]">
                          {new Date(h.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {h.note && <p className="mt-0.5 text-xs text-[var(--texte-doux)]">{h.note}</p>}
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderTrackForm
