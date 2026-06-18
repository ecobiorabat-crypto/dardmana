'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'
import type { SiteSettingsData } from '@/lib/settings'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function BrandingForm({ initial }: { initial: SiteSettingsData }) {
  const [siteName, setSiteName] = useState(initial.siteName)
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? '')
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
        body: JSON.stringify({ siteName, logoUrl }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
      setNote({ type: 'ok', text: 'Paramètres enregistrés.' })
    } catch (err) {
      setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
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

      {/* Nom du site */}
      <div>
        <label htmlFor="siteName" className={labelCls}>
          Nom du site
        </label>
        <input
          id="siteName"
          className={inputCls}
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="Dar Dmana"
        />
        <p className="mt-1 text-xs text-[var(--texte-doux)]">
          Utilisé comme texte de repli si aucun logo n’est défini.
        </p>
      </div>

      {/* Logo */}
      <div>
        <p className={labelCls}>Logo</p>

        {/* Aperçu du logo actuel */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center overflow-hidden border border-[var(--bordure)] bg-[var(--vert-fonce)]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo actuel" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-titre text-xl text-[var(--or-royal)]">{siteName || 'Dar Dmana'}</span>
            )}
          </div>
          <p className="text-xs text-[var(--texte-doux)]">
            Aperçu sur fond vert (couleur de l’en-tête).
          </p>
        </div>

        <ImageUploader
          images={logoUrl ? [logoUrl] : []}
          onChange={(imgs) => setLogoUrl(imgs[0] ?? '')}
          maxImages={1}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--bordure)] pt-6">
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
      </div>
    </div>
  )
}

export default BrandingForm
