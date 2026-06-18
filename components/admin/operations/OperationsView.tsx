'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminCard, StatusBadge } from '@/components/admin/ui'
import { formatMad } from '@/lib/utils/price'
import {
  shipOrderAction,
  retryDeliveryAction,
  markDeliveryHandledAction,
} from '@/app/admin/(panel)/actions'

interface Address {
  fullName?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  region?: string
  country?: string
}

export interface OpsOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  totalMad: number | string
  paymentMethod: string
  orderStatus: string
  shippingAddress: Address
  orderItems: { productName: string; quantity: number }[]
}

export interface OpsError {
  id: string
  orderNumber: string
  customerName: string
  deliveryError: string | null
  orderStatus: string
}

export interface OpsStats {
  shipped: number
  pending: number
  delivered: number
  cancelled: number
}

function formatAddress(a: Address): string {
  return [a.addressLine1, a.addressLine2, a.postalCode, a.city, a.country].filter(Boolean).join(', ')
}

function printDeliverySlip(order: OpsOrder) {
  const a = order.shippingAddress ?? {}
  const items = order.orderItems
    .map((it) => `<tr><td style="padding:4px 8px;border:1px solid #ddd">${it.productName}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${it.quantity}</td></tr>`)
    .join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fiche livraison ${order.orderNumber}</title>
  <style>body{font-family:Georgia,serif;color:#1a1a1a;padding:32px;max-width:640px;margin:auto}
  h1{font-size:20px}.muted{color:#777;font-size:12px}table{border-collapse:collapse;width:100%;margin-top:12px}
  .box{border:1px solid #ddd;padding:16px;margin-top:16px}</style></head><body>
  <h1>Dar Dmana — Fiche de livraison</h1>
  <p class="muted">Commande <strong>${order.orderNumber}</strong> · ${order.paymentMethod} · ${formatMad(Number(order.totalMad))}</p>
  <div class="box"><strong>Destinataire</strong><br>${a.fullName ?? order.customerName}<br>${order.customerPhone ?? a.phone ?? ''}<br>${formatAddress(a)}</div>
  <div class="box"><strong>Contenu</strong><table><thead><tr><th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Produit</th><th style="padding:4px 8px;border:1px solid #ddd">Qté</th></tr></thead><tbody>${items}</tbody></table></div>
  <script>window.onload=function(){window.print()}</script></body></html>`
  const w = window.open('', '_blank', 'width=720,height=900')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}

function exportCsv(orders: OpsOrder[]) {
  const headers = ['Numéro', 'Client', 'Téléphone', 'Adresse', 'Ville', 'Produits', 'Montant', 'Paiement']
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const rows = orders.map((o) => {
    const a = o.shippingAddress ?? {}
    const products = o.orderItems.map((it) => `${it.productName} x${it.quantity}`).join(' | ')
    return [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      [a.addressLine1, a.addressLine2, a.postalCode].filter(Boolean).join(' '),
      a.city ?? '',
      products,
      String(Number(o.totalMad)),
      o.paymentMethod,
    ].map(escape).join(',')
  })
  const csv = [headers.map(escape).join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `commandes-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function OperationsView({
  toShip,
  errors,
  stats,
  todayOrders,
}: {
  toShip: OpsOrder[]
  errors: OpsError[]
  stats: OpsStats
  todayOrders: OpsOrder[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const res = await fn()
      setFeedback(res.ok ? res.message ?? 'Fait' : res.error ?? 'Erreur')
      if (res.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="rounded-md border border-[var(--bordure)] bg-[var(--creme)] px-4 py-3 text-sm text-[var(--vert-fonce)]">
          {feedback}
        </div>
      )}

      {/* Stats du jour */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DayStat label="Expédiées" value={stats.shipped} color="var(--vert-moyen)" />
        <DayStat label="En attente" value={stats.pending} color="var(--alerte)" />
        <DayStat label="Livrées" value={stats.delivered} color="var(--vert-fonce)" />
        <DayStat label="Annulées" value={stats.cancelled} color="var(--erreur)" />
      </div>

      {/* Section 1 : À expédier */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titre text-xl text-[var(--vert-fonce)]">
            Commandes à expédier <span className="text-[var(--texte-doux)]">({toShip.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => exportCsv(todayOrders)}
            className="border border-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
          >
            Export CSV du jour
          </button>
        </div>

        {toShip.length === 0 ? (
          <AdminCard><p className="text-sm text-[var(--texte-doux)]">Aucune commande à expédier.</p></AdminCard>
        ) : (
          <div className="space-y-4">
            {toShip.map((o) => (
              <ShipCard key={o.id} order={o} pending={pending} onShip={run} onPrint={printDeliverySlip} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 : Erreurs transporteur */}
      <section>
        <h2 className="mb-4 font-titre text-xl text-[var(--vert-fonce)]">
          Erreurs transporteur <span className="text-[var(--texte-doux)]">({errors.length})</span>
        </h2>
        {errors.length === 0 ? (
          <AdminCard><p className="text-sm text-[var(--texte-doux)]">Aucune erreur d&apos;envoi. ✔</p></AdminCard>
        ) : (
          <div className="space-y-3">
            {errors.map((e) => (
              <AdminCard key={e.id} className="border-l-4 !border-l-[var(--erreur)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/commandes/${e.id}`} className="font-medium text-[var(--vert-fonce)] hover:underline">
                        {e.orderNumber}
                      </Link>
                      <StatusBadge status={e.orderStatus} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--texte)]">{e.customerName}</p>
                    <p className="mt-1 text-xs text-[var(--erreur)]">{e.deliveryError}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => retryDeliveryAction(e.id))}
                      className="bg-[var(--vert-fonce)] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[var(--creme)] disabled:opacity-50"
                    >
                      Relancer
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => markDeliveryHandledAction(e.id))}
                      className="border border-[var(--bordure)] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[var(--texte)] disabled:opacity-50"
                    >
                      Traitement manuel
                    </button>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function DayStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-[var(--bordure)] bg-[var(--blanc)] p-4 text-center">
      <p className="font-titre text-3xl" style={{ color }}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">{label}</p>
    </div>
  )
}

function ShipCard({
  order,
  pending,
  onShip,
  onPrint,
}: {
  order: OpsOrder
  pending: boolean
  onShip: (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => void
  onPrint: (o: OpsOrder) => void
}) {
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('Amana')
  const a = order.shippingAddress ?? {}

  return (
    <AdminCard>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/commandes/${order.id}`} className="font-medium text-[var(--vert-fonce)] hover:underline">
              {order.orderNumber}
            </Link>
            <StatusBadge status={order.orderStatus} />
            <span className="text-sm text-[var(--texte-doux)]">{order.paymentMethod}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--texte)]">
            {order.customerName} · {order.customerPhone}
          </p>
          <p className="text-xs text-[var(--texte-doux)]">{formatAddress(a)}</p>
          <p className="mt-2 text-xs text-[var(--texte-doux)]">
            {order.orderItems.map((it) => `${it.productName} ×${it.quantity}`).join(' · ')}
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--vert-fonce)]">{formatMad(Number(order.totalMad))}</p>
        </div>

        <div className="flex flex-col gap-2 lg:w-64">
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Transporteur"
            className="border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
          />
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Numéro de suivi"
            className="border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
          />
          <button
            type="button"
            disabled={pending || !tracking.trim()}
            onClick={() => onShip(() => shipOrderAction(order.id, tracking.trim(), carrier.trim()))}
            className="bg-[var(--or-royal)] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[var(--noir)] disabled:opacity-50"
          >
            Marquer expédiée
          </button>
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="border border-[var(--bordure)] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[var(--texte)]"
          >
            Fiche livraison
          </button>
        </div>
      </div>
    </AdminCard>
  )
}

export default OperationsView
