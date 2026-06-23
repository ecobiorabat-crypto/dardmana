'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusBadge, PaymentBadge } from '@/components/admin/ui'
import { formatMad } from '@/lib/utils/price'
import { trackingUrl } from '@/lib/utils/order-status'
import { updateOrderAction, cancelOrderAction, refundOrderAction } from '@/app/admin/(panel)/actions'

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

export interface AdminOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: Address
  subtotalMad: number | string
  shippingCostMad: number | string
  discountMad: number | string
  totalMad: number | string
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  source: string
  trackingNumber: string | null
  carrier: string | null
  adminNotes: string | null
  notes: string | null
  createdAt: string
  orderItems: {
    id: string
    productName: string
    productImage: string
    quantity: number
    unitPriceMad: number | string
    totalMad: number | string
    product: { slug: string } | null
  }[]
  statusHistory: { id: string; status: string; note: string | null; changedBy: string | null; createdAt: string }[]
  payments: { id: string; method: string; status: string; amount: number | string; currency: string; createdAt: string; providerRef: string | null }[]
}

const PAY_LABELS_AR: Record<string, string> = {
  COD: 'الدفع عند الاستلام',
  WHATSAPP: 'واتساب',
  CMI: 'CMI',
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
}

const STATUSES = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
}

function formatAddress(a: Address): string {
  return [a.addressLine1, a.addressLine2, a.postalCode, a.city, a.region, a.country].filter(Boolean).join(', ')
}

export function OrderDetailAdmin({ order }: { order: AdminOrder }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const [status, setStatus] = useState(order.orderStatus)
  const [tracking, setTracking] = useState(order.trackingNumber ?? '')
  const [carrier, setCarrier] = useState(order.carrier ?? '')
  const [notes, setNotes] = useState(order.adminNotes ?? '')

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const res = await fn()
      setFeedback(res.ok ? res.message ?? 'Fait' : res.error ?? 'Erreur')
      if (res.ok) router.refresh()
    })
  }

  const saveAll = () =>
    run(() => updateOrderAction({ id: order.id, orderStatus: status, trackingNumber: tracking, carrier, adminNotes: notes }))

  const printSlip = () => {
    const a = order.shippingAddress ?? {}
    const items = order.orderItems
      .map((it) => `<tr><td style="padding:4px 8px;border:1px solid #ddd">${it.productName}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${it.quantity}</td></tr>`)
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fiche livraison ${order.orderNumber}</title>
    <style>body{font-family:Georgia,serif;color:#1a1a1a;padding:32px;max-width:640px;margin:auto}h1{font-size:20px}.muted{color:#777;font-size:12px}table{border-collapse:collapse;width:100%;margin-top:12px}.box{border:1px solid #ddd;padding:16px;margin-top:16px}</style></head><body>
    <h1>Dar Dmana — Fiche de livraison</h1>
    <p class="muted">Commande <strong>${order.orderNumber}</strong> · ${order.paymentMethod} · ${formatMad(Number(order.totalMad))}</p>
    <div class="box"><strong>Destinataire</strong><br>${a.fullName ?? order.customerName}<br>${order.customerPhone}<br>${formatAddress(a)}</div>
    <div class="box"><strong>Contenu</strong><table><thead><tr><th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Produit</th><th style="padding:4px 8px;border:1px solid #ddd">Qté</th></tr></thead><tbody>${items}</tbody></table></div>
    <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open('', '_blank', 'width=720,height=900')
    if (w) { w.document.write(html); w.document.close() }
  }

  const a = order.shippingAddress ?? {}
  const track = order.trackingNumber ? trackingUrl(order.carrier, order.trackingNumber) : null

  // ── WhatsApp manuel (sans API : ouvre wa.me directement) ──
  const waPhone = order.customerPhone.replace(/\D/g, '')
  const openWhatsApp = (message: string) => {
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const sendConfirmation = () => {
    const produits = order.orderItems.map((it) => `${it.productName} (×${it.quantity})`).join('، ')
    const msg =
      `السلام عليكم ${order.customerName} 🌿\n` +
      `تأكيد طلبك من دار ضمانة ✅\n` +
      `رقم الطلب : ${order.orderNumber}\n` +
      `المنتجات : ${produits}\n` +
      `المبلغ الإجمالي : ${Number(order.totalMad)} درهم\n` +
      `طريقة الدفع : ${PAY_LABELS_AR[order.paymentMethod] ?? order.paymentMethod}\n` +
      `سيتم التواصل معك لتحديد موعد التسليم.\n` +
      `شكراً لثقتك في دار ضمانة 🤍`
    openWhatsApp(msg)
  }

  const sendTracking = () => {
    const msg =
      `السلام عليكم ${order.customerName} 🌿\n` +
      `طلبك في الطريق إليك 🚚\n` +
      `رقم الطلب : ${order.orderNumber}\n` +
      `رقم التتبع : ${tracking || '—'}\n` +
      `الناقل : ${carrier || '—'}\n` +
      `دار ضمانة — الأصالة في كل قطعة 🤍`
    openWhatsApp(msg)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/commandes" className="text-sm text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]">← Commandes</Link>
          <h1 className="font-titre text-2xl text-[var(--vert-fonce)]">{order.orderNumber}</h1>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={printSlip} className="border border-[var(--bordure)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--texte)]">
            Fiche livraison
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-md border border-[var(--bordure)] bg-[var(--creme)] px-4 py-3 text-sm text-[var(--vert-fonce)]">{feedback}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Produits */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Produits</h2>
            <div className="space-y-3">
              {order.orderItems.map((it) => (
                <div key={it.id} className="flex items-center gap-4">
                  <div className="h-14 w-12 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {it.productImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.productImage} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--texte)]">{it.productName}</p>
                    <p className="text-xs text-[var(--texte-doux)]">{formatMad(Number(it.unitPriceMad))} × {it.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-[var(--vert-fonce)]">{formatMad(Number(it.totalMad))}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-[var(--bordure)] pt-4 text-sm">
              <Row label="Sous-total" value={formatMad(Number(order.subtotalMad))} />
              <Row label="Livraison" value={formatMad(Number(order.shippingCostMad))} />
              {Number(order.discountMad) > 0 && <Row label="Remise" value={`− ${formatMad(Number(order.discountMad))}`} />}
              <div className="flex justify-between pt-2 text-base font-medium text-[var(--vert-fonce)]">
                <span>Total</span><span>{formatMad(Number(order.totalMad))}</span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Historique des statuts</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-[var(--texte-doux)]">Aucun changement enregistré.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-[var(--bordure)] pl-5">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-[var(--or-royal)]" />
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-xs text-[var(--texte-doux)]">{new Date(h.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                    {h.note && <p className="mt-1 text-sm text-[var(--texte)]">{h.note}</p>}
                    {h.changedBy && <p className="text-xs text-[var(--texte-doux)]">par {h.changedBy}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Paiements */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Paiement</h2>
            <p className="text-sm text-[var(--texte)]">
              Méthode : <strong>{order.paymentMethod}</strong> — <PaymentBadge status={order.paymentStatus} />
            </p>
            {order.payments.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between text-[var(--texte-doux)]">
                    <span>{p.method} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}{p.providerRef ? ` · ${p.providerRef}` : ''}</span>
                    <span>{formatMad(Number(p.amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Client */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-3 font-titre text-lg text-[var(--vert-fonce)]">Client</h2>
            <p className="text-sm text-[var(--texte)]">{order.customerName}</p>
            <p className="text-sm text-[var(--texte-doux)]">{order.customerEmail}</p>
            <p className="text-sm text-[var(--texte-doux)]">{order.customerPhone}</p>
            <div className="mt-3 border-t border-[var(--bordure)] pt-3">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Adresse de livraison</p>
              <p className="mt-1 text-sm text-[var(--texte)]">{a.fullName ?? order.customerName}</p>
              <p className="text-sm text-[var(--texte-doux)]">{formatAddress(a)}</p>
            </div>
          </section>

          {/* WhatsApp — boutons manuels (sans API) */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-3 font-titre text-lg text-[var(--vert-fonce)]">WhatsApp</h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={sendConfirmation}
                disabled={!waPhone}
                className="flex items-center justify-center gap-2 bg-[#25D366] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                ✓ Confirmer via WhatsApp
              </button>
              <button
                type="button"
                onClick={sendTracking}
                disabled={!waPhone}
                className="flex items-center justify-center gap-2 border border-[#25D366] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-[#128C7E] transition-colors hover:bg-[#25D366]/10 disabled:opacity-40"
              >
                🚚 Envoyer le suivi WhatsApp
              </button>
            </div>
            {!waPhone && (
              <p className="mt-2 text-xs text-[var(--texte-doux)]">Aucun numéro de téléphone client.</p>
            )}
          </section>

          {/* Livraison / actions */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-3 font-titre text-lg text-[var(--vert-fonce)]">Livraison & statut</h2>
            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mb-3 w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Transporteur</label>
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className="mb-3 w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]" placeholder="Amana, DHL…" />

            <label className="mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Numéro de suivi</label>
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="mb-2 w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]" />
            {track && (
              <a href={track} target="_blank" rel="noreferrer" className="mb-3 inline-block text-xs text-[var(--vert-fonce)] underline">
                Suivre le colis ↗
              </a>
            )}

            <button type="button" onClick={saveAll} disabled={pending} className="mt-2 w-full bg-[var(--vert-fonce)] px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--creme)] disabled:opacity-50">
              Enregistrer
            </button>
          </section>

          {/* Notes admin */}
          <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
            <h2 className="mb-3 font-titre text-lg text-[var(--vert-fonce)]">Notes internes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full resize-y border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
              placeholder="Note visible uniquement par l'équipe…"
            />
            <button type="button" onClick={() => run(() => updateOrderAction({ id: order.id, adminNotes: notes }))} disabled={pending} className="mt-2 w-full border border-[var(--bordure)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--texte)] disabled:opacity-50">
              Enregistrer la note
            </button>
          </section>

          {/* Actions critiques */}
          <section className="border border-[var(--erreur)]/40 bg-[var(--blanc)] p-5">
            <h2 className="mb-3 font-titre text-lg text-[var(--erreur)]">Zone sensible</h2>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => run(() => cancelOrderAction(order.id))} disabled={pending} className="border border-[var(--erreur)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--erreur)] disabled:opacity-50">
                Annuler la commande
              </button>
              <button type="button" onClick={() => run(() => refundOrderAction(order.id))} disabled={pending} className="border border-[var(--bordure)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--texte)] disabled:opacity-50">
                Rembourser
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--texte-doux)]">
      <span>{label}</span><span className="text-[var(--texte)]">{value}</span>
    </div>
  )
}

export default OrderDetailAdmin
