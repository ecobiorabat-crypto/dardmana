'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const STATUSES = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
const SOURCES = ['SHOP', 'WHATSAPP', 'ADMIN']
const PAYMENTS = ['COD', 'CMI', 'STRIPE', 'PAYPAL']

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
}
const SOURCE_LABELS: Record<string, string> = { SHOP: 'Boutique', WHATSAPP: 'WhatsApp', ADMIN: 'Admin' }

export function OrdersFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`)
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    update('search', search.trim())
  }

  const selectCls = 'border border-[var(--bordure)] bg-[var(--blanc)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form onSubmit={submitSearch} className="flex flex-1 min-w-[220px] items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="N° commande, nom, email, téléphone…"
          className="w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]"
        />
        <button type="submit" className="ml-2 bg-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--creme)]">
          Rechercher
        </button>
      </form>

      <select value={params.get('status') ?? ''} onChange={(e) => update('status', e.target.value)} className={selectCls}>
        <option value="">Tous statuts</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>

      <select value={params.get('source') ?? ''} onChange={(e) => update('source', e.target.value)} className={selectCls}>
        <option value="">Toutes sources</option>
        {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
      </select>

      <select value={params.get('payment') ?? ''} onChange={(e) => update('payment', e.target.value)} className={selectCls}>
        <option value="">Tous paiements</option>
        {PAYMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <input
        type="date"
        value={params.get('dateFrom') ?? ''}
        onChange={(e) => update('dateFrom', e.target.value)}
        className={selectCls}
        aria-label="Date de début"
      />
      <input
        type="date"
        value={params.get('dateTo') ?? ''}
        onChange={(e) => update('dateTo', e.target.value)}
        className={selectCls}
        aria-label="Date de fin"
      />
    </div>
  )
}

export default OrdersFilters
