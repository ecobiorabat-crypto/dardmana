'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateHomepageAction } from '@/app/admin/(panel)/cms/actions'
import type { HomepageSettingsData } from '@/lib/homepage'

const LANGS = ['fr', 'ar', 'en'] as const
type Lang = (typeof LANGS)[number]
const LANG_LABELS: Record<Lang, string> = { fr: 'Français', ar: 'العربية', en: 'English' }
const cap = (l: Lang) => (l === 'ar' ? 'Ar' : l === 'en' ? 'En' : 'Fr') as 'Fr' | 'Ar' | 'En'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function HomepageForm({
  initial,
  products,
}: {
  initial: HomepageSettingsData
  products: { id: string; nameFr: string }[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<HomepageSettingsData>(initial)
  const [lang, setLang] = useState<Lang>('fr')
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function set<K extends keyof HomepageSettingsData>(key: K, value: HomepageSettingsData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleFeatured(id: string) {
    setForm((f) => {
      const exists = f.featuredProductIds.includes(id)
      return {
        ...f,
        featuredProductIds: exists
          ? f.featuredProductIds.filter((x) => x !== id)
          : [...f.featuredProductIds, id],
      }
    })
  }

  function handleSave() {
    setNote(null)
    startTransition(async () => {
      const res = await updateHomepageAction(form)
      if (res.ok) {
        setNote({ type: 'ok', text: res.message ?? 'Enregistré' })
        router.refresh()
      } else {
        setNote({ type: 'err', text: res.error ?? 'Erreur' })
      }
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
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

      {/* Langue tabs */}
      <div className="flex gap-2">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 text-xs uppercase tracking-[0.1em] ${lang === l ? 'bg-[var(--vert-fonce)] text-[var(--creme)]' : 'border border-[var(--bordure)] text-[var(--texte)]'}`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Bandeau d'annonce */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Bandeau d’annonce</h3>
        <label className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.announcementActive}
            onChange={(e) => set('announcementActive', e.target.checked)}
            className="h-4 w-4 accent-[var(--vert-fonce)]"
          />
          <span className="text-sm text-[var(--texte)]">Afficher le bandeau en haut du site</span>
        </label>
        {LANGS.map((l) => (
          <div key={l} className={lang === l ? '' : 'hidden'} dir={l === 'ar' ? 'rtl' : 'ltr'}>
            <label className={labelCls}>Texte du bandeau ({l.toUpperCase()})</label>
            <input
              className={inputCls}
              value={(form[`announcementText${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
              onChange={(e) => set(`announcementText${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
              placeholder="Livraison offerte dès 500 MAD"
            />
          </div>
        ))}
      </section>

      {/* Hero */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Section Hero</h3>
        {LANGS.map((l) => (
          <div key={l} className={lang === l ? 'space-y-4' : 'hidden'} dir={l === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <label className={labelCls}>Titre ({l.toUpperCase()})</label>
              <input
                className={inputCls}
                value={(form[`heroTitle${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`heroTitle${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
              />
            </div>
            <div>
              <label className={labelCls}>Sous-titre ({l.toUpperCase()})</label>
              <textarea
                rows={2}
                className={`${inputCls} resize-y`}
                value={(form[`heroSubtitle${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`heroSubtitle${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
              />
            </div>
          </div>
        ))}
        <p className="mt-3 text-xs text-[var(--texte-doux)]">
          Laissez vide pour conserver le texte par défaut (traductions intégrées).
        </p>
      </section>

      {/* Newsletter */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Newsletter</h3>
        {LANGS.map((l) => (
          <div key={l} className={lang === l ? '' : 'hidden'} dir={l === 'ar' ? 'rtl' : 'ltr'}>
            <label className={labelCls}>Titre newsletter ({l.toUpperCase()})</label>
            <input
              className={inputCls}
              value={(form[`newsletterTitle${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
              onChange={(e) => set(`newsletterTitle${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
            />
          </div>
        ))}
      </section>

      {/* Section savoir-faire (storytelling) */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Section savoir-faire</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">
          Bloc « Notre savoir-faire » de la page d’accueil. Laissez vide pour conserver le texte par défaut.
        </p>

        {/* Statistiques — valeurs communes à toutes les langues */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Stat 1 — valeur</label>
            <input
              className={inputCls}
              value={form.stat1Value ?? ''}
              onChange={(e) => set('stat1Value', e.target.value)}
              placeholder="500+"
            />
          </div>
          <div>
            <label className={labelCls}>Stat 2 — valeur</label>
            <input
              className={inputCls}
              value={form.stat2Value ?? ''}
              onChange={(e) => set('stat2Value', e.target.value)}
              placeholder="6"
            />
          </div>
          <div>
            <label className={labelCls}>Stat 3 — valeur</label>
            <input
              className={inputCls}
              value={form.stat3Value ?? ''}
              onChange={(e) => set('stat3Value', e.target.value)}
              placeholder="48h"
            />
          </div>
        </div>

        {LANGS.map((l) => (
          <div key={l} className={lang === l ? 'space-y-4' : 'hidden'} dir={l === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <label className={labelCls}>Eyebrow ({l.toUpperCase()})</label>
              <input
                className={inputCls}
                value={(form[`storytellingEyebrow${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`storytellingEyebrow${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
                placeholder="Notre savoir-faire"
              />
            </div>
            <div>
              <label className={labelCls}>Titre ({l.toUpperCase()})</label>
              <input
                className={inputCls}
                value={(form[`storytellingTitle${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`storytellingTitle${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
              />
            </div>
            <div>
              <label className={labelCls}>Texte ({l.toUpperCase()})</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-y`}
                value={(form[`storytellingText${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`storytellingText${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Stat 1 — libellé ({l.toUpperCase()})</label>
                <input
                  className={inputCls}
                  value={(form[`stat1Label${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                  onChange={(e) => set(`stat1Label${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
                  placeholder="Clients satisfaits"
                />
              </div>
              <div>
                <label className={labelCls}>Stat 2 — libellé ({l.toUpperCase()})</label>
                <input
                  className={inputCls}
                  value={(form[`stat2Label${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                  onChange={(e) => set(`stat2Label${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
                  placeholder="Collections"
                />
              </div>
              <div>
                <label className={labelCls}>Stat 3 — libellé ({l.toUpperCase()})</label>
                <input
                  className={inputCls}
                  value={(form[`stat3Label${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                  onChange={(e) => set(`stat3Label${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
                  placeholder="Livraison"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Texte du bouton ({l.toUpperCase()})</label>
              <input
                className={inputCls}
                value={(form[`storytellingButtonText${cap(l)}` as keyof HomepageSettingsData] as string) ?? ''}
                onChange={(e) => set(`storytellingButtonText${cap(l)}` as keyof HomepageSettingsData, e.target.value as never)}
                placeholder="Découvrir notre histoire"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Produits mis en avant */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Produits mis en avant</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">
          Sélection affichée dans la section « Best-sellers ». Si vide, les produits marqués
          « En vedette » sont utilisés.
        </p>
        {products.length === 0 ? (
          <p className="text-sm text-[var(--texte-doux)]">Aucun produit actif.</p>
        ) : (
          <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-1 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.featuredProductIds.includes(p.id)}
                  onChange={() => toggleFeatured(p.id)}
                  className="h-4 w-4 accent-[var(--vert-fonce)]"
                />
                <span className="truncate text-[var(--texte)]">{p.nameFr}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <a
          href="/fr"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[var(--vert-fonce)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
        >
          Voir sur le site ↗
        </a>
        <Link href="/admin/cms" className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline">
          Retour aux pages
        </Link>
      </div>
    </div>
  )
}

export default HomepageForm
