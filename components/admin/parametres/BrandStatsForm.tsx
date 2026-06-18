'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface BrandStatsData {
  tiktokFollowers: number
  tiktokLikes: number
  tiktokHandle: string
  googleRating: number
  googleReviewsCount: number
  satisfactionRate: number
  updatedAt: string | null
  updatedBy: string | null
}

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function BrandStatsForm({ initial }: { initial: BrandStatsData }) {
  const [tiktokFollowers, setTiktokFollowers] = useState(String(initial.tiktokFollowers))
  const [tiktokLikes, setTiktokLikes] = useState(String(initial.tiktokLikes))
  const [tiktokHandle, setTiktokHandle] = useState(initial.tiktokHandle)
  const [googleRating, setGoogleRating] = useState(String(initial.googleRating))
  const [googleReviewsCount, setGoogleReviewsCount] = useState(String(initial.googleReviewsCount))
  const [satisfactionRate, setSatisfactionRate] = useState(String(initial.satisfactionRate))
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt)
  const [updatedBy, setUpdatedBy] = useState(initial.updatedBy)

  async function handleSave() {
    setSaving(true)
    setNote(null)
    try {
      const res = await fetch('/api/admin/brand-stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tiktokFollowers: Math.max(0, Math.trunc(Number(tiktokFollowers) || 0)),
          tiktokLikes: Math.max(0, Math.trunc(Number(tiktokLikes) || 0)),
          tiktokHandle: tiktokHandle.trim(),
          googleRating: Math.min(5, Math.max(0, Number(googleRating) || 0)),
          googleReviewsCount: Math.max(0, Math.trunc(Number(googleReviewsCount) || 0)),
          satisfactionRate: Math.min(100, Math.max(0, Number(satisfactionRate) || 0)),
        }),
      })
      const data = (await res.json()) as {
        error?: string
        stats?: { updatedAt: string; updatedBy: string | null }
      }
      if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
      if (data.stats) {
        setUpdatedAt(data.stats.updatedAt)
        setUpdatedBy(data.stats.updatedBy)
      }
      setNote({ type: 'ok', text: 'Statistiques enregistrées.' })
    } catch (err) {
      setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="border-l-4 border-[var(--or-royal)] bg-[var(--gris-perle)]/40 px-4 py-3 text-sm text-[var(--texte-doux)]">
        Mets à jour ces chiffres chaque semaine pour refléter ta vraie croissance sur les réseaux.
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

      {/* TikTok */}
      <fieldset className="space-y-4">
        <legend className="font-titre text-lg text-[var(--vert-fonce)]">TikTok</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tiktokFollowers" className={labelCls}>
              Abonnés TikTok
            </label>
            <input
              id="tiktokFollowers"
              type="number"
              min={0}
              className={inputCls}
              value={tiktokFollowers}
              onChange={(e) => setTiktokFollowers(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="tiktokLikes" className={labelCls}>
              Likes TikTok
            </label>
            <input
              id="tiktokLikes"
              type="number"
              min={0}
              className={inputCls}
              value={tiktokLikes}
              onChange={(e) => setTiktokLikes(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="tiktokHandle" className={labelCls}>
            Pseudo TikTok
          </label>
          <input
            id="tiktokHandle"
            type="text"
            className={inputCls}
            value={tiktokHandle}
            onChange={(e) => setTiktokHandle(e.target.value)}
            placeholder="@dardmana"
          />
        </div>
      </fieldset>

      {/* Google */}
      <fieldset className="space-y-4">
        <legend className="font-titre text-lg text-[var(--vert-fonce)]">Google</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="googleRating" className={labelCls}>
              Note Google (sur 5)
            </label>
            <input
              id="googleRating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              className={inputCls}
              value={googleRating}
              onChange={(e) => setGoogleRating(e.target.value)}
              placeholder="4.9"
            />
          </div>
          <div>
            <label htmlFor="googleReviewsCount" className={labelCls}>
              Nombre d’avis Google
            </label>
            <input
              id="googleReviewsCount"
              type="number"
              min={0}
              className={inputCls}
              value={googleReviewsCount}
              onChange={(e) => setGoogleReviewsCount(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Satisfaction */}
      <div className="max-w-xs">
        <label htmlFor="satisfactionRate" className={labelCls}>
          Taux de satisfaction (%)
        </label>
        <input
          id="satisfactionRate"
          type="number"
          min={0}
          max={100}
          className={inputCls}
          value={satisfactionRate}
          onChange={(e) => setSatisfactionRate(e.target.value)}
        />
      </div>

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

export default BrandStatsForm
