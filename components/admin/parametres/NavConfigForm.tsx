'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  NAV_CONFIG_KEYS,
  NAV_CONFIG_LABELS,
  type NavConfig,
  type NavConfigKey,
} from '@/lib/nav-config-types'

export function NavConfigForm({ initial }: { initial: NavConfig }) {
  const router = useRouter()
  const [config, setConfig] = useState<NavConfig>(initial)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function toggle(key: NavConfigKey) {
    setConfig((c) => ({ ...c, [key]: !c[key] }))
  }

  async function handleSave() {
    setSaving(true)
    setNote(null)
    try {
      const res = await fetch('/api/admin/settings/nav', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      })
      const data = (await res.json()) as { error?: string; navConfig?: NavConfig }
      if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
      if (data.navConfig) setConfig(data.navConfig)
      setNote({ type: 'ok', text: 'Navigation enregistrée. Les liens sont mis à jour.' })
      router.refresh()
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

      <p className="text-xs text-[var(--texte-doux)]">
        Désactiver une page la retire de la navbar, du mega-menu et du footer ; la page
        redirige alors vers l’accueil. Les pages essentielles (catalogue, panier, paiement,
        compte) restent toujours actives.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {NAV_CONFIG_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 border border-[var(--bordure)] px-4 py-3"
          >
            <span className="text-sm text-[var(--texte)]">{NAV_CONFIG_LABELS[key]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={config[key]}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                config[key] ? 'bg-[var(--vert-fonce)]' : 'bg-[var(--bordure)]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  config[key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        ))}
      </div>

      <div className="border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la navigation'}
        </button>
      </div>
    </div>
  )
}

export default NavConfigForm
