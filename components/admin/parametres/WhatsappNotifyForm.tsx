'use client'

import { useState } from 'react'
import type { SiteSettingsData } from '@/lib/settings'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function WhatsappNotifyForm({ initial }: { initial: SiteSettingsData }) {
  const [enabled, setEnabled] = useState(initial.whatsappNotificationsEnabled)
  const [number, setNumber] = useState(initial.whatsappNotificationNumber ?? '')
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setNote(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          whatsappNotificationsEnabled: enabled,
          whatsappNotificationNumber: number.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
      setNote({ type: 'ok', text: 'Préférences WhatsApp enregistrées.' })
    } catch (err) {
      setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
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

      {/* Toggle ON/OFF */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-[var(--vert-fonce)]"
        />
        <span className="text-sm text-[var(--texte)]">
          Recevoir les commandes sur WhatsApp{' '}
          <span className="text-[var(--texte-doux)]">(notification à chaque nouvelle commande)</span>
        </span>
      </label>

      {/* Numéro admin */}
      <div>
        <label htmlFor="waNumber" className={labelCls}>Numéro WhatsApp admin</label>
        <input
          id="waNumber"
          className={inputCls}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="+212600000000"
        />
        <p className="mt-1 text-xs text-[var(--texte-doux)]">
          Numéro enregistré auprès de CallMeBot. Nécessite <code>CALLMEBOT_API_KEY</code> dans
          l’environnement (voir README).
        </p>
      </div>

      <div className="border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default WhatsappNotifyForm
