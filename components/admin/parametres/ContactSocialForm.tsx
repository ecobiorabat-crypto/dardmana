'use client'

import { useState } from 'react'
import type { SiteSettingsData } from '@/lib/settings'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

type ContactKey =
  | 'phone' | 'whatsapp' | 'address' | 'email'
  | 'socialInstagram' | 'socialFacebook' | 'socialTikTok'

const FIELDS: { key: ContactKey; label: string; placeholder: string; type?: string }[] = [
  { key: 'phone', label: 'Téléphone', placeholder: '+212 6 00 00 00 00' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+212600000000' },
  { key: 'email', label: 'E-mail', placeholder: 'contact@dardmana.ma', type: 'email' },
  { key: 'address', label: 'Adresse', placeholder: 'Casablanca, Maroc' },
  { key: 'socialInstagram', label: 'Instagram (URL)', placeholder: 'https://instagram.com/dardmana', type: 'url' },
  { key: 'socialFacebook', label: 'Facebook (URL)', placeholder: 'https://facebook.com/dardmana', type: 'url' },
  { key: 'socialTikTok', label: 'TikTok (URL)', placeholder: 'https://tiktok.com/@dardmana', type: 'url' },
]

export function ContactSocialForm({ initial }: { initial: SiteSettingsData }) {
  const [values, setValues] = useState<Record<ContactKey, string>>({
    phone: initial.phone ?? '',
    whatsapp: initial.whatsapp ?? '',
    address: initial.address ?? '',
    email: initial.email ?? '',
    socialInstagram: initial.socialInstagram ?? '',
    socialFacebook: initial.socialFacebook ?? '',
    socialTikTok: initial.socialTikTok ?? '',
  })
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
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
      setNote({ type: 'ok', text: 'Coordonnées enregistrées.' })
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.key === 'address' ? 'sm:col-span-2' : ''}>
            <label htmlFor={f.key} className={labelCls}>{f.label}</label>
            <input
              id={f.key}
              type={f.type ?? 'text'}
              className={inputCls}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les coordonnées'}
        </button>
      </div>
    </div>
  )
}

export default ContactSocialForm
