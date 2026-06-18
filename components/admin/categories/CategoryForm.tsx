'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'

export interface CategoryInitial {
  id?: string
  slug: string
  nameFr: string
  nameAr: string
  nameEn: string
  descriptionFr: string
  descriptionAr: string
  descriptionEn: string
  icon: string
  imageUrl: string
  sortOrder: string
  isActive: boolean
}

export const EMPTY_CATEGORY: CategoryInitial = {
  slug: '',
  nameFr: '',
  nameAr: '',
  nameEn: '',
  descriptionFr: '',
  descriptionAr: '',
  descriptionEn: '',
  icon: '',
  imageUrl: '',
  sortOrder: '0',
  isActive: true,
}

const LANGS = ['fr', 'ar', 'en'] as const
type Lang = (typeof LANGS)[number]
const LANG_LABELS: Record<Lang, string> = { fr: 'Français', ar: 'العربية', en: 'English' }

const EMOJI_PRESETS = ['📿', '💍', '🌹', '🌿', '💎', '🧵', '🏺', '✨', '🕌', '🪬']

const inputCls = 'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function cap(l: Lang): 'Fr' | 'Ar' | 'En' {
  return (l.charAt(0).toUpperCase() + l.slice(1)) as 'Fr' | 'Ar' | 'En'
}

export function CategoryForm({ initial }: { initial: CategoryInitial }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<CategoryInitial>(initial)
  const [lang, setLang] = useState<Lang>('fr')
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof CategoryInitial>(key: K, value: CategoryInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const images = form.imageUrl ? [form.imageUrl] : []

  const submit = () => {
    setError(null)

    const payload = {
      slug: form.slug.trim() || slugify(form.nameFr),
      nameFr: form.nameFr.trim(),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionFr: form.descriptionFr.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      icon: form.icon.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }

    if (!payload.nameFr || !payload.nameAr || !payload.nameEn) {
      setError('Les noms FR, AR et EN sont obligatoires.')
      return
    }

    startTransition(async () => {
      const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories'
      const method = form.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\u2019enregistrement')
        return
      }

      router.push('/admin/categories')
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error && (
        <div className="rounded-md border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-4 py-3 text-sm text-[var(--erreur)]">
          {error}
        </div>
      )}

      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <div className="mb-4 flex gap-2">
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

        {LANGS.map((l) => (
          <div key={l} className={lang === l ? 'space-y-4' : 'hidden'} dir={l === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <label className={labelCls}>Nom ({l.toUpperCase()}) *</label>
              <input
                className={inputCls}
                value={form[`name${cap(l)}` as keyof CategoryInitial] as string}
                onChange={(e) => set(`name${cap(l)}` as keyof CategoryInitial, e.target.value as never)}
              />
            </div>
            <div>
              <label className={labelCls}>Description ({l.toUpperCase()})</label>
              <textarea
                rows={4}
                className={`${inputCls} resize-y`}
                value={form[`description${cap(l)}` as keyof CategoryInitial] as string}
                onChange={(e) => set(`description${cap(l)}` as keyof CategoryInitial, e.target.value as never)}
              />
            </div>
          </div>
        ))}
      </section>

      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Identité visuelle</h3>

        <div className="mb-4">
          <label className={labelCls}>Icône (emoji)</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => set('icon', emoji)}
                className={`flex h-10 w-10 items-center justify-center border text-lg transition-colors ${form.icon === emoji ? 'border-[var(--or-royal)] bg-[var(--gris-perle)]' : 'border-[var(--bordure)] hover:border-[var(--or-royal)]'}`}
                aria-label={`Icône ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            className={`${inputCls} mt-3 max-w-xs`}
            placeholder="…ou saisir un emoji"
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
            maxLength={10}
          />
        </div>

        <div>
          <label className={labelCls}>Image de couverture</label>
          <ImageUploader
            images={images}
            maxImages={1}
            onChange={(next) => set('imageUrl', next[0] ?? '')}
          />
        </div>
      </section>

      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Paramètres</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Slug</label>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              onBlur={() => {
                if (!form.slug && form.nameFr) set('slug', slugify(form.nameFr))
              }}
              placeholder="auto-généré depuis le nom FR"
            />
          </div>
          <div>
            <label className={labelCls}>Ordre d&apos;affichage</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', e.target.value)}
            />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[var(--texte)]">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Catégorie active (visible sur le site)
        </label>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="bg-[var(--vert-fonce)] px-6 py-3 text-xs uppercase tracking-[0.14em] text-[var(--creme)] disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : form.id ? 'Mettre à jour' : 'Créer la catégorie'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/categories')}
          className="border border-[var(--bordure)] px-6 py-3 text-xs uppercase tracking-[0.14em] text-[var(--texte)]"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

export default CategoryForm
