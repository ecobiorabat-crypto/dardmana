'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCmsPageAction, updateCmsPageAction, type CmsPageInput } from '@/app/admin/(panel)/cms/actions'

const LANGS = ['fr', 'ar', 'en'] as const
type Lang = (typeof LANGS)[number]
const LANG_LABELS: Record<Lang, string> = { fr: 'Français', ar: 'العربية', en: 'English' }
const cap = (l: Lang) => (l === 'ar' ? 'Ar' : l === 'en' ? 'En' : 'Fr') as 'Fr' | 'Ar' | 'En'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function CmsPageForm({ initial, mode }: { initial: CmsPageInput; mode: 'create' | 'edit' }) {
  const router = useRouter()
  const [form, setForm] = useState<CmsPageInput>(initial)
  const [lang, setLang] = useState<Lang>('fr')
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function set<K extends keyof CmsPageInput>(key: K, value: CmsPageInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave() {
    setNote(null)
    startTransition(async () => {
      const res = mode === 'create' ? await createCmsPageAction(form) : await updateCmsPageAction(form)
      if (res.ok) {
        if (mode === 'create') {
          router.push(`/admin/cms/${form.slug.trim().toLowerCase()}`)
          router.refresh()
        } else {
          setNote({ type: 'ok', text: res.message ?? 'Enregistré' })
          router.refresh()
        }
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

      {/* Slug */}
      <div>
        <label className={labelCls}>Slug (URL)</label>
        {mode === 'create' ? (
          <input
            className={inputCls}
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="notre-histoire"
          />
        ) : (
          <p className="font-mono text-sm text-[var(--texte-doux)]">/{form.slug}</p>
        )}
      </div>

      {/* Langue tabs */}
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
              <label className={labelCls}>Titre ({l.toUpperCase()})</label>
              <input
                className={inputCls}
                value={form[`title${cap(l)}` as keyof CmsPageInput] as string}
                onChange={(e) => set(`title${cap(l)}` as keyof CmsPageInput, e.target.value as never)}
              />
            </div>
            <div>
              <label className={labelCls}>Contenu ({l.toUpperCase()}) — markdown simple</label>
              <textarea
                rows={16}
                className={`${inputCls} resize-y font-mono`}
                value={form[`content${cap(l)}` as keyof CmsPageInput] as string}
                onChange={(e) => set(`content${cap(l)}` as keyof CmsPageInput, e.target.value as never)}
                placeholder={'# Titre\n\nParagraphe de texte.\n\n## Sous-titre\n\n- élément de liste\n- autre élément\n\n**gras** et texte normal.'}
              />
              <p className="mt-1 text-xs text-[var(--texte-doux)]">
                Mise en forme : <code># Titre</code>, <code>## Sous-titre</code>, <code>- liste</code>,{' '}
                <code>**gras**</code>. Une ligne vide sépare les paragraphes.
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Statut */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => set('isPublished', e.target.checked)}
          className="h-4 w-4 accent-[var(--vert-fonce)]"
        />
        <span className="text-sm text-[var(--texte)]">
          Publiée <span className="text-[var(--texte-doux)]">(visible sur le site ; sinon brouillon)</span>
        </span>
      </label>

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
        {mode === 'edit' && (
          <a
            href={`/fr/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[var(--vert-fonce)] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)]"
          >
            Voir sur le site ↗
          </a>
        )}
        <Link href="/admin/cms" className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline">
          Retour aux pages
        </Link>
      </div>
    </div>
  )
}

export default CmsPageForm
