'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCouponAction, deleteCouponAction } from '@/app/admin/(panel)/actions'

export interface CouponRow {
  id: string
  code: string
  type: string
  value: number | string
  minOrderMad: number | string
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
}

const TYPE_LABELS: Record<string, string> = {
  PERCENT: 'Pourcentage (%)',
  FIXED_MAD: 'Montant fixe (MAD)',
  FREE_SHIPPING: 'Livraison offerte',
}

const inputCls = 'border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'

const EMPTY = { id: '', code: '', type: 'PERCENT', value: '', minOrderMad: '0', maxUses: '', expiresAt: '', isActive: true }

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)

  const editing = !!form.id

  const load = (c: CouponRow) =>
    setForm({
      id: c.id,
      code: c.code,
      type: c.type,
      value: String(Number(c.value)),
      minOrderMad: String(Number(c.minOrderMad)),
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
      isActive: c.isActive,
    })

  const reset = () => setForm(EMPTY)

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => {
    startTransition(async () => {
      const res = await fn()
      setFeedback(res.ok ? res.message ?? 'Fait' : res.error ?? 'Erreur')
      if (res.ok) { after?.(); router.refresh() }
    })
  }

  const save = () =>
    run(
      () =>
        upsertCouponAction({
          id: form.id || undefined,
          code: form.code,
          type: form.type,
          value: Number(form.value) || 0,
          minOrderMad: Number(form.minOrderMad) || 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
          isActive: form.isActive,
        }),
      reset,
    )

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-md border border-[var(--bordure)] bg-[var(--creme)] px-4 py-3 text-sm text-[var(--vert-fonce)]">{feedback}</div>
      )}

      {/* Form */}
      <div className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h2 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">{editing ? 'Modifier le coupon' : 'Nouveau coupon'}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <input className={`${inputCls} uppercase`} placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className={inputCls} type="number" placeholder="Valeur" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} disabled={form.type === 'FREE_SHIPPING'} />
          <input className={inputCls} type="number" placeholder="Min. commande" value={form.minOrderMad} onChange={(e) => setForm({ ...form, minOrderMad: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Usages max" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          <input className={inputCls} type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--texte)]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Actif
          </label>
          <button type="button" onClick={save} disabled={pending || !form.code} className="bg-[var(--vert-fonce)] px-5 py-2 text-xs uppercase tracking-[0.12em] text-[var(--creme)] disabled:opacity-50">
            {editing ? 'Mettre à jour' : 'Créer'}
          </button>
          {editing && <button type="button" onClick={reset} className="border border-[var(--bordure)] px-5 py-2 text-xs uppercase tracking-[0.12em] text-[var(--texte)]">Annuler</button>}
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--bordure)] bg-[var(--blanc)]">
        {coupons.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--texte-doux)]">Aucun coupon.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Valeur</th>
                  <th className="px-5 py-3 font-medium">Min.</th>
                  <th className="px-5 py-3 font-medium">Usages</th>
                  <th className="px-5 py-3 font-medium">Expire</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--bordure)] last:border-0">
                    <td className="px-5 py-3 font-medium text-[var(--vert-fonce)]">{c.code}</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{TYPE_LABELS[c.type] ?? c.type}</td>
                    <td className="px-5 py-3">{c.type === 'FREE_SHIPPING' ? '—' : c.type === 'PERCENT' ? `${Number(c.value)}%` : `${Number(c.value)} MAD`}</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{Number(c.minOrderMad)} MAD</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{c.currentUses}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</td>
                    <td className="px-5 py-3 text-[var(--texte-doux)]">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: c.isActive ? 'var(--vert-moyen)' : 'var(--texte-doux)' }}>{c.isActive ? 'Actif' : 'Inactif'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-3 text-xs">
                        <button type="button" onClick={() => load(c)} className="text-[var(--vert-fonce)] hover:underline">Éditer</button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => upsertCouponAction({ id: c.id, code: c.code, type: c.type, value: Number(c.value), minOrderMad: Number(c.minOrderMad), maxUses: c.maxUses, expiresAt: c.expiresAt, isActive: !c.isActive }))}
                          className="text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]"
                        >
                          {c.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => { if (confirm('Supprimer ce coupon ?')) run(() => deleteCouponAction(c.id)) }}
                          className="text-[var(--erreur)] hover:underline"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CouponsManager
