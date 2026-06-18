'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DeliverySettingsPublic } from '@/lib/delivery/settings'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

const PROVIDERS: { id: 'MANUAL' | 'AMANA' | 'CTM'; label: string; hint: string }[] = [
  { id: 'MANUAL', label: 'Manuel', hint: 'Fiche de livraison à traiter à la main (par défaut).' },
  { id: 'AMANA', label: 'Amana (Poste Maroc)', hint: 'Nécessite une clé API Amana.' },
  { id: 'CTM', label: 'CTM Messagerie', hint: 'Nécessite une clé API CTM.' },
]

export function DeliveryForm({ initial }: { initial: DeliverySettingsPublic }) {
  const [active, setActive] = useState(initial.activeProvider)
  const [amanaKey, setAmanaKey] = useState('')
  const [ctmKey, setCtmKey] = useState('')
  const [amanaConfigured, setAmanaConfigured] = useState(initial.amanaConfigured)
  const [ctmConfigured, setCtmConfigured] = useState(initial.ctmConfigured)
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt)
  const [updatedBy, setUpdatedBy] = useState(initial.updatedBy)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setNote(null)
    try {
      const body: Record<string, string> = { activeProvider: active }
      if (amanaKey.trim()) body.amanaApiKey = amanaKey.trim()
      if (ctmKey.trim()) body.ctmApiKey = ctmKey.trim()

      const res = await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string; settings?: DeliverySettingsPublic }
      if (!res.ok || !data.settings) throw new Error(data.error ?? 'Échec de l’enregistrement')

      setAmanaConfigured(data.settings.amanaConfigured)
      setCtmConfigured(data.settings.ctmConfigured)
      setUpdatedAt(data.settings.updatedAt)
      setUpdatedBy(data.settings.updatedBy)
      setAmanaKey('')
      setCtmKey('')
      setNote({ type: 'ok', text: 'Paramètres de livraison enregistrés.' })
    } catch (err) {
      setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="border-l-4 border-[var(--or-royal)] bg-[var(--gris-perle)]/40 px-4 py-3 text-sm text-[var(--texte-doux)]">
        Sans clé API valide, le transporteur choisi bascule automatiquement sur le mode manuel —
        aucune commande n’est bloquée. Voir le README (« Connecter un vrai transporteur »).
      </p>

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

      {/* Sélecteur de provider */}
      <fieldset className="space-y-3">
        <legend className={labelCls}>Transporteur actif</legend>
        {PROVIDERS.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
              active === p.id ? 'border-[var(--vert-fonce)] bg-[var(--gris-perle)]/30' : 'border-[var(--bordure)]'
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={active === p.id}
              onChange={() => setActive(p.id)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--texte)]">
                {p.label}
                {p.id === 'AMANA' && amanaConfigured && (
                  <span className="ms-2 text-xs text-[var(--vert-moyen)]">● clé configurée</span>
                )}
                {p.id === 'CTM' && ctmConfigured && (
                  <span className="ms-2 text-xs text-[var(--vert-moyen)]">● clé configurée</span>
                )}
              </span>
              <span className="block text-xs text-[var(--texte-doux)]">{p.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {/* Credentials (write-only) */}
      <fieldset className="space-y-4">
        <legend className="font-titre text-lg text-[var(--vert-fonce)]">Clés API (saisie unique)</legend>
        <div>
          <label htmlFor="amanaKey" className={labelCls}>
            Clé API Amana {amanaConfigured && <span className="text-[var(--vert-moyen)]">(déjà enregistrée)</span>}
          </label>
          <input
            id="amanaKey"
            type="password"
            autoComplete="off"
            className={inputCls}
            value={amanaKey}
            onChange={(e) => setAmanaKey(e.target.value)}
            placeholder={amanaConfigured ? '•••••••••• (laisser vide pour conserver)' : 'Coller la clé Amana'}
          />
        </div>
        <div>
          <label htmlFor="ctmKey" className={labelCls}>
            Clé API CTM {ctmConfigured && <span className="text-[var(--vert-moyen)]">(déjà enregistrée)</span>}
          </label>
          <input
            id="ctmKey"
            type="password"
            autoComplete="off"
            className={inputCls}
            value={ctmKey}
            onChange={(e) => setCtmKey(e.target.value)}
            placeholder={ctmConfigured ? '•••••••••• (laisser vide pour conserver)' : 'Coller la clé CTM'}
          />
        </div>
        <p className="text-xs text-[var(--texte-doux)]">
          Les clés sont chiffrées en base et ne sont jamais réaffichées après enregistrement.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <Link
          href="/admin/parametres"
          className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline"
        >
          Retour aux paramètres
        </Link>
        {updatedAt && (
          <p className="text-xs text-[var(--texte-doux)]">
            Dernière mise à jour :{' '}
            {new Date(updatedAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {updatedBy ? ` par ${updatedBy}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

export default DeliveryForm
