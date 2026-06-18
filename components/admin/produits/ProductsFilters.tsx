'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function ProductsFilters({ categories }: { categories: { id: string; nameFr: string }[] }) {
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

  const selectCls = 'border border-[var(--bordure)] bg-[var(--blanc)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form onSubmit={(e) => { e.preventDefault(); update('search', search.trim()) }} className="flex flex-1 min-w-[220px]">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou SKU…" className="w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]" />
        <button type="submit" className="ml-2 bg-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[var(--creme)]">OK</button>
      </form>

      <select value={params.get('categoryId') ?? ''} onChange={(e) => update('categoryId', e.target.value)} className={selectCls}>
        <option value="">Toutes catégories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
      </select>

      <select value={params.get('status') ?? ''} onChange={(e) => update('status', e.target.value)} className={selectCls}>
        <option value="">Tous statuts</option>
        <option value="DRAFT">Brouillon</option>
        <option value="ACTIVE">Actif</option>
        <option value="ARCHIVED">Archivé</option>
      </select>

      <select value={params.get('lowStock') ?? ''} onChange={(e) => update('lowStock', e.target.value)} className={selectCls}>
        <option value="">Tout stock</option>
        <option value="1">Stock faible</option>
      </select>
    </div>
  )
}

export default ProductsFilters
