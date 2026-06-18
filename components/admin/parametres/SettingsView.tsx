'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS, type AdminRole } from '@/lib/auth/permissions'
import { updateShippingMethodAction } from '@/app/admin/(panel)/actions'

export interface ShippingRow {
  id: string
  name: string
  carrier: string
  countries: string[]
  priceMad: number | string
  freeThresholdMad: number | string | null
  isActive: boolean
  minDays: number
  maxDays: number
}

export interface AdminRow {
  email: string
  name: string
  role: AdminRole
}

export interface GeneralSettings {
  shopName: string
  shopEmail: string
  currency: string
}

const TABS = [
  { id: 'general', label: 'Général' },
  { id: 'shipping', label: 'Livraison' },
  { id: 'payments', label: 'Paiements' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'admins', label: 'Admins' },
] as const
type TabId = (typeof TABS)[number]['id']

const inputCls = 'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function SettingsView({
  shipping,
  admins,
  general,
  isSuperAdmin = false,
  accessDenied = false,
}: {
  shipping: ShippingRow[]
  admins: AdminRow[]
  general: GeneralSettings
  isSuperAdmin?: boolean
  accessDenied?: boolean
}) {
  const [tab, setTab] = useState<TabId>('general')
  const [note, setNote] = useState<string | null>(null)

  return (
    <div>
      {accessDenied && (
        <div className="mb-6 rounded-md border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-4 py-3 text-sm text-[var(--erreur)]">
          Accès refusé — cette section est réservée aux Super Administrateurs.
        </div>
      )}

      {isSuperAdmin && (
        <div className="mb-6 flex items-center justify-between rounded-md border border-[var(--bordure)] bg-[var(--blanc)] px-4 py-3">
          <p className="text-sm text-[var(--texte)]">Gérer les comptes administrateurs, rôles et invitations.</p>
          <Link
            href="/admin/parametres/admins"
            className="bg-[var(--vert-fonce)] px-4 py-2 text-xs uppercase tracking-[0.12em] text-[var(--creme)]"
          >
            Équipe →
          </Link>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--bordure)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${tab === t.id ? 'border-[var(--or-royal)] text-[var(--vert-fonce)]' : 'border-transparent text-[var(--texte-doux)] hover:text-[var(--texte)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {note && (
        <div className="mb-6 rounded-md border border-[var(--bordure)] bg-[var(--creme)] px-4 py-3 text-sm text-[var(--vert-fonce)]">{note}</div>
      )}

      {tab === 'general' && <GeneralTab general={general} onNote={setNote} />}
      {tab === 'shipping' && <ShippingTab shipping={shipping} onNote={setNote} />}
      {tab === 'payments' && <PaymentsTab onNote={setNote} />}
      {tab === 'notifications' && <NotificationsTab onNote={setNote} />}
      {tab === 'admins' && <AdminsTab admins={admins} isSuperAdmin={isSuperAdmin} />}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl border border-[var(--bordure)] bg-[var(--blanc)] p-6">{children}</div>
}

function GeneralTab({ general, onNote }: { general: GeneralSettings; onNote: (s: string) => void }) {
  const [v, setV] = useState(general)
  return (
    <Card>
      <div className="space-y-4">
        <div><label className={labelCls}>Nom de la boutique</label><input className={inputCls} value={v.shopName} onChange={(e) => setV({ ...v, shopName: e.target.value })} /></div>
        <div><label className={labelCls}>Email de contact</label><input className={inputCls} value={v.shopEmail} onChange={(e) => setV({ ...v, shopEmail: e.target.value })} /></div>
        <div>
          <label className={labelCls}>Devise</label>
          <select className={inputCls} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })}>
            <option value="MAD">MAD — Dirham</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <button type="button" onClick={() => onNote('Réglages généraux conservés pour la session. Pour les persister, ajoutez un modèle « Settings » à la base.')} className="bg-[var(--vert-fonce)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--creme)]">
          Enregistrer
        </button>
      </div>
    </Card>
  )
}

function ShippingTab({ shipping, onNote }: { shipping: ShippingRow[]; onNote: (s: string) => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState(shipping)

  const update = (id: string, key: keyof ShippingRow, value: string | boolean) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const save = (r: ShippingRow) => {
    startTransition(async () => {
      const res = await updateShippingMethodAction({
        id: r.id,
        priceMad: Number(r.priceMad) || 0,
        freeThresholdMad: r.freeThresholdMad !== '' && r.freeThresholdMad !== null ? Number(r.freeThresholdMad) : null,
        isActive: r.isActive,
      })
      onNote(res.ok ? res.message ?? 'Enregistré' : res.error ?? 'Erreur')
      if (res.ok) router.refresh()
    })
  }

  if (rows.length === 0) {
    return <Card><p className="text-sm text-[var(--texte-doux)]">Aucune méthode de livraison configurée en base.</p></Card>
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className="max-w-3xl border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--vert-fonce)]">{r.name}</p>
              <p className="text-xs text-[var(--texte-doux)]">{r.carrier} · {r.countries.join(', ')} · {r.minDays}–{r.maxDays} j</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--texte)]">
              <input type="checkbox" checked={r.isActive} onChange={(e) => update(r.id, 'isActive', e.target.checked)} /> Active
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><label className={labelCls}>Tarif (MAD)</label><input type="number" className={inputCls} value={String(r.priceMad)} onChange={(e) => update(r.id, 'priceMad', e.target.value)} /></div>
            <div><label className={labelCls}>Seuil gratuit (MAD)</label><input type="number" className={inputCls} value={r.freeThresholdMad === null ? '' : String(r.freeThresholdMad)} onChange={(e) => update(r.id, 'freeThresholdMad', e.target.value)} /></div>
            <div className="flex items-end">
              <button type="button" onClick={() => save(r)} disabled={pending} className="bg-[var(--vert-fonce)] px-5 py-2 text-xs uppercase tracking-[0.12em] text-[var(--creme)] disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? true)
  return (
    <label className="flex items-center justify-between border border-[var(--bordure)] bg-[var(--blanc)] px-4 py-3 text-sm text-[var(--texte)]">
      {label}
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
    </label>
  )
}

function PaymentsTab({ onNote }: { onNote: (s: string) => void }) {
  return (
    <div className="max-w-2xl space-y-3">
      <Toggle label="Paiement à la livraison (COD) — Maroc" defaultOn />
      <Toggle label="CMI (carte bancaire marocaine)" defaultOn />
      <Toggle label="Stripe (international)" defaultOn />
      <Toggle label="PayPal" defaultOn={false} />
      <button type="button" onClick={() => onNote('Préférences de paiement conservées pour la session.')} className="bg-[var(--vert-fonce)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--creme)]">Enregistrer</button>
    </div>
  )
}

function NotificationsTab({ onNote }: { onNote: (s: string) => void }) {
  return (
    <div className="max-w-2xl space-y-3">
      <Toggle label="Email — confirmation de commande" defaultOn />
      <Toggle label="Email — expédition" defaultOn />
      <Toggle label="SMS — confirmation" defaultOn={false} />
      <Toggle label="WhatsApp — suivi de commande" defaultOn />
      <button type="button" onClick={() => onNote('Préférences de notification conservées pour la session.')} className="bg-[var(--vert-fonce)] px-5 py-2.5 text-xs uppercase tracking-[0.12em] text-[var(--creme)]">Enregistrer</button>
    </div>
  )
}

function AdminsTab({ admins, isSuperAdmin }: { admins: AdminRow[]; isSuperAdmin: boolean }) {
  return (
    <div className="max-w-3xl">
      <div className="border border-[var(--bordure)] bg-[var(--blanc)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--bordure)] text-left text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
              <th className="px-5 py-3 font-medium">Nom</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.email} className="border-b border-[var(--bordure)] last:border-0">
                <td className="px-5 py-3 text-[var(--texte)]">{a.name}</td>
                <td className="px-5 py-3 text-[var(--texte-doux)]">{a.email}</td>
                <td className="px-5 py-3">{ROLE_LABELS[a.role] ?? a.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isSuperAdmin ? (
        <p className="mt-4 text-xs text-[var(--texte-doux)]">
          Pour inviter, modifier les rôles ou désactiver des comptes, ouvrez la page{' '}
          <Link href="/admin/parametres/admins" className="text-[var(--vert-fonce)] underline-offset-2 hover:underline">
            Équipe
          </Link>
          .
        </p>
      ) : (
        <p className="mt-4 text-xs text-[var(--texte-doux)]">
          La gestion complète de l&apos;équipe est réservée aux Super Administrateurs.
        </p>
      )}
    </div>
  )
}

export default SettingsView
