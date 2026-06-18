'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adjustStockAction } from '@/app/admin/(panel)/actions'

export interface StockProduct {
  id: string
  nameFr: string
  sku: string | null
  images: string[]
  stock: number
  lowStockThreshold: number
}

export function StockTable({ products }: { products: StockProduct[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
            <th className="px-5 py-3 font-medium">Produit</th>
            <th className="px-5 py-3 font-medium">SKU</th>
            <th className="px-5 py-3 font-medium">Seuil</th>
            <th className="px-5 py-3 font-medium">État</th>
            <th className="px-5 py-3 font-medium">Ajuster</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <StockRow key={p.id} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockRow({ product }: { product: StockProduct }) {
  const router = useRouter()
  const [value, setValue] = useState(String(product.stock))
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const changed = Number(value) !== product.stock
  const stock = product.stock
  const state =
    stock === 0
      ? { label: 'Rupture', color: 'var(--erreur)' }
      : stock <= product.lowStockThreshold
        ? { label: 'Faible', color: 'var(--alerte)' }
        : { label: 'OK', color: 'var(--vert-moyen)' }

  const save = () => {
    startTransition(async () => {
      const res = await adjustStockAction(product.id, Number(value))
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
        router.refresh()
      }
    })
  }

  return (
    <tr
      className="border-b border-[var(--bordure)] last:border-0"
      style={{ background: stock === 0 ? 'color-mix(in srgb, var(--erreur) 5%, transparent)' : stock <= product.lowStockThreshold ? 'color-mix(in srgb, var(--alerte) 6%, transparent)' : undefined }}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-9 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
            {product.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <span className="font-medium text-[var(--texte)]">{product.nameFr}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-[var(--texte-doux)]">{product.sku ?? '—'}</td>
      <td className="px-5 py-3 text-[var(--texte-doux)]">{product.lowStockThreshold}</td>
      <td className="px-5 py-3">
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ color: state.color, background: `color-mix(in srgb, ${state.color} 12%, transparent)` }}>
          {state.label}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 border border-[var(--bordure)] px-2 py-1.5 text-sm outline-none focus:border-[var(--or-royal)]"
          />
          <button
            type="button"
            onClick={save}
            disabled={!changed || pending}
            className="bg-[var(--vert-fonce)] px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--creme)] disabled:opacity-40"
          >
            {saved ? '✓' : 'OK'}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default StockTable
