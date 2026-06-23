'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMad } from '@/lib/utils/price'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

interface LineItem {
  productId: string
  name: string
  unitPriceMad: number
  quantity: number
}

interface ProductResult {
  id: string
  nameFr: string
  priceMad: number | string
  images?: string[]
  stock?: number
}

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Paiement à la livraison (COD)' },
  { value: 'CMI', label: 'CMI' },
  { value: 'STRIPE', label: 'Stripe' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
] as const

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
}
const SOURCES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SHOP', label: 'Boutique' },
] as const

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function NewOrderForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Client
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('MA')
  const [lookupMsg, setLookupMsg] = useState<string | null>(null)

  // Produits
  const [items, setItems] = useState<LineItem[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [searching, setSearching] = useState(false)

  // Commande
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]['value']>('COD')
  const [orderStatus, setOrderStatus] = useState<(typeof ORDER_STATUSES)[number]>('NEW')
  const [source, setSource] = useState<(typeof SOURCES)[number]['value']>('ADMIN')
  const [orderDate, setOrderDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  // ── Auto-remplissage client par téléphone ──
  async function lookupCustomer() {
    const p = phone.trim()
    if (p.length < 6) return
    setLookupMsg(null)
    try {
      const res = await fetch(`/api/admin/customers/lookup?phone=${encodeURIComponent(p)}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.customer) {
        setName(data.customer.name ?? '')
        setEmail(data.customer.email ?? '')
        setAddressLine1(data.customer.addressLine1 ?? '')
        setCity(data.customer.city ?? '')
        setCountry(data.customer.country ?? 'MA')
        setLookupMsg(`Client existant trouvé (${data.customer.totalOrders} commande(s)). Champs pré-remplis.`)
      } else {
        setLookupMsg('Aucun client avec ce numéro — un nouveau client sera créé.')
      }
    } catch {
      /* silencieux */
    }
  }

  // ── Recherche produits (debounce) ──
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const q = search.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=8`)
        const data = await res.json()
        setResults(Array.isArray(data.products) ? data.products : [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [search])

  function addProduct(p: ProductResult) {
    setItems((prev) => {
      if (prev.some((i) => i.productId === p.id)) return prev
      return [...prev, { productId: p.id, name: p.nameFr, unitPriceMad: Number(p.priceMad), quantity: 1 }]
    })
    setSearch('')
    setResults([])
  }

  function updateItem(productId: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)))
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const total = items.reduce((sum, i) => sum + i.unitPriceMad * i.quantity, 0)

  function submit() {
    setNote(null)
    if (phone.trim().length < 6) return setNote({ type: 'err', text: 'Téléphone du client requis.' })
    if (!name.trim()) return setNote({ type: 'err', text: 'Nom du client requis.' })
    if (items.length === 0) return setNote({ type: 'err', text: 'Ajoutez au moins un produit.' })

    const body = {
      customer: { phone: phone.trim(), name: name.trim(), email: email.trim(), addressLine1: addressLine1.trim(), city: city.trim(), country: country.trim().toUpperCase() || 'MA' },
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceMad: i.unitPriceMad })),
      paymentMethod,
      orderStatus,
      source,
      orderDate,
      notes: notes.trim() || undefined,
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        const data = (await res.json().catch(() => ({}))) as { orderId?: string; error?: string }
        if (!res.ok || !data.orderId) throw new Error(data.error ?? 'Échec de la création')
        router.push(`/admin/commandes/${data.orderId}?created=1`)
        router.refresh()
      } catch (err) {
        setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
      }
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
      {note && (
        <div
          className={
            note.type === 'ok'
              ? 'border border-[var(--succes)]/40 bg-[color-mix(in_srgb,var(--succes)_8%,transparent)] px-3 py-2 text-sm text-[var(--succes)]'
              : 'border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-3 py-2 text-sm text-[var(--erreur)]'
          }
        >
          {note.text}
        </div>
      )}

      {/* ── Section client ── */}
      <section className="space-y-4 border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="font-titre text-lg text-[var(--vert-fonce)]">Client</h3>
        <div>
          <label htmlFor="phone" className={labelCls}>Téléphone *</label>
          <div className="flex gap-2">
            <input
              id="phone"
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={lookupCustomer}
              placeholder="0612345678"
            />
            <button
              type="button"
              onClick={lookupCustomer}
              className="shrink-0 border border-[var(--bordure)] px-4 text-sm text-[var(--texte)] hover:border-[var(--or-royal)]"
            >
              Rechercher
            </button>
          </div>
          {lookupMsg && <p className="mt-1 text-xs text-[var(--texte-doux)]">{lookupMsg}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>Nom complet *</label>
            <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email (optionnel)</label>
            <input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div>
          <label htmlFor="addr" className={labelCls}>Adresse de livraison</label>
          <input id="addr" className={inputCls} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelCls}>Ville</label>
            <input id="city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label htmlFor="country" className={labelCls}>Pays</label>
            <input id="country" className={inputCls} value={country} maxLength={2} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="MA" />
          </div>
        </div>
      </section>

      {/* ── Section produits ── */}
      <section className="space-y-4 border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="font-titre text-lg text-[var(--vert-fonce)]">Produits</h3>

        <div className="relative">
          <label htmlFor="search" className={labelCls}>Rechercher un produit</label>
          <input
            id="search"
            className={inputCls}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom du produit…"
            autoComplete="off"
          />
          {(results.length > 0 || searching) && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto border border-[var(--bordure)] bg-[var(--blanc)] shadow-lg">
              {searching && <p className="px-3 py-2 text-xs text-[var(--texte-doux)]">Recherche…</p>}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[var(--gris-perle)]/60"
                >
                  <span className="truncate text-[var(--texte)]">{p.nameFr}</span>
                  <span className="shrink-0 text-xs text-[var(--texte-doux)]">{formatMad(Number(p.priceMad))}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <p className="border border-dashed border-[var(--bordure)] py-6 text-center text-sm text-[var(--texte-doux)]">
            Aucun produit. Recherchez ci-dessus puis « + Ajouter ».
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex flex-wrap items-end gap-3 border border-[var(--bordure)] p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--texte)]">{item.name}</p>
                </div>
                <div className="w-20">
                  <label className={labelCls}>Qté</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div className="w-28">
                  <label className={labelCls}>Prix unit.</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    value={item.unitPriceMad}
                    onChange={(e) => updateItem(item.productId, { unitPriceMad: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <div className="w-24 text-right">
                  <label className={labelCls}>Total</label>
                  <p className="py-2 text-sm font-medium text-[var(--vert-fonce)]">
                    {formatMad(item.unitPriceMad * item.quantity)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label="Retirer"
                  className="mb-1 border border-[var(--bordure)] px-2 py-1.5 text-xs text-[var(--texte-doux)] hover:border-[var(--erreur)] hover:text-[var(--erreur)]"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--bordure)] pt-3">
              <span className="text-sm text-[var(--texte-doux)]">Total commande</span>
              <span className="font-titre text-xl text-[var(--vert-fonce)]">{formatMad(total)}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Section commande ── */}
      <section className="space-y-4 border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="font-titre text-lg text-[var(--vert-fonce)]">Commande</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="payment" className={labelCls}>Méthode de paiement</label>
            <select id="payment" className={inputCls} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelCls}>Statut initial</label>
            <select id="status" className={inputCls} value={orderStatus} onChange={(e) => setOrderStatus(e.target.value as typeof orderStatus)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className={labelCls}>Date de commande</label>
            <input id="date" type="date" className={inputCls} value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="source" className={labelCls}>Source</label>
            <select id="source" className={inputCls} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={labelCls}>Notes internes</label>
          <textarea id="notes" rows={3} className={`${inputCls} resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {pending ? 'Création…' : 'Créer la commande'}
        </button>
        <Link href="/admin/commandes" className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline">
          Annuler
        </Link>
      </div>
    </div>
  )
}

export default NewOrderForm
