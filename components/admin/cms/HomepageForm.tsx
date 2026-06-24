'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'
import { updateHomepageAction } from '@/app/admin/(panel)/cms/actions'
import { EMPTY_HERO_SLIDE, type CategoryGridTile, type HeroSlide } from '@/lib/homepage-types'
import type { HomepageSettingsData } from '@/lib/homepage'

/** Garantit exactement 3 slides éditables (les vides sont filtrés à la sauvegarde). */
function padSlides(slides: HeroSlide[]): HeroSlide[] {
  return [0, 1, 2].map((i) => slides[i] ?? { ...EMPTY_HERO_SLIDE })
}

function slideIsEmpty(s: HeroSlide): boolean {
  return !s.imageFr && !s.imageAr && !s.titleFr && !s.titleAr && !s.subtitleFr && !s.subtitleAr
}

const CATEGORY_LABELS: Record<string, string> = {
  sabhah: 'Sabhah', bracelets: 'Bracelets', huiles: 'Huiles parfumées', pierres: 'Pierres naturelles',
}

/** Contrôle compact : aperçu + suppression si une image existe, sinon uploader. */
function SlideImage({ label, url, onChange }: { label: string; url: string; onChange: (u: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {url ? (
        <div className="flex items-start gap-3">
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded border border-[var(--bordure)] bg-[var(--gris-perle)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[var(--erreur)] underline-offset-2 hover:underline"
          >
            Supprimer
          </button>
        </div>
      ) : (
        <ImageUploader
          images={[]}
          maxImages={1}
          onChange={(imgs) => {
            const u = imgs[imgs.length - 1]
            if (u) onChange(u)
          }}
        />
      )}
    </div>
  )
}

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
  const [form, setForm] = useState<HomepageSettingsData>(() => ({
    ...initial,
    heroSlides: padSlides(initial.heroSlides),
  }))
  const [lang, setLang] = useState<Lang>('fr')
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function set<K extends keyof HomepageSettingsData>(key: K, value: HomepageSettingsData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setSlide(i: number, patch: Partial<HeroSlide>) {
    setForm((f) => ({
      ...f,
      heroSlides: f.heroSlides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }))
  }

  function setTile(i: number, patch: Partial<CategoryGridTile>) {
    setForm((f) => ({
      ...f,
      categoryGrid: f.categoryGrid.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }))
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
    // Filtre les slides vides : si tous le sont, heroSlides = [] → repli sur l'ancien Hero.
    const cleanedSlides = form.heroSlides.filter((s) => !slideIsEmpty(s))
    startTransition(async () => {
      const res = await updateHomepageAction({ ...form, heroSlides: cleanedSlides })
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

        {/* Image savoir-faire (colonne droite) */}
        <div className="mt-6 border-t border-[var(--bordure)] pt-5">
          <p className="mb-1 text-sm font-medium text-[var(--texte)]">Image savoir-faire</p>
          <p className="mb-3 text-xs text-[var(--texte-doux)]">
            Photo affichée dans la colonne droite. Laissez vide pour conserver le bloc par défaut.
          </p>

          {form.storytellingImageUrl ? (
            <div className="mb-4 flex items-start gap-4">
              <div className="relative h-40 w-32 overflow-hidden rounded-md border border-[var(--bordure)] bg-[var(--gris-perle)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.storytellingImageUrl} alt="Aperçu de l'image savoir-faire" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => set('storytellingImageUrl', null)}
                className="border border-[var(--erreur)]/50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--erreur)] transition-colors hover:bg-[var(--erreur)] hover:text-white"
              >
                Supprimer l'image
              </button>
            </div>
          ) : (
            <p className="mb-4 text-sm text-[var(--texte-doux)]">Aucune image définie (bloc vert par défaut).</p>
          )}

          <ImageUploader
            images={[]}
            maxImages={1}
            onChange={(imgs) => {
              const url = imgs[imgs.length - 1]
              if (url) set('storytellingImageUrl', url)
            }}
          />
        </div>
      </section>

      {/* Slides Hero (slider cinématique) */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Slides Hero</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">
          Jusqu’à 3 slides. Dès qu’un slide a une image ou un titre, le slider cinématique
          remplace l’ancien Hero. Laissez les 3 vides pour conserver l’ancien Hero.
        </p>

        <div className="space-y-5">
          {form.heroSlides.map((slide, i) => (
            <div key={i} className="border border-[var(--bordure)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--vert-fonce)]">
                Slide {i + 1}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SlideImage
                  label="Image de fond (FR)"
                  url={slide.imageFr}
                  onChange={(u) => setSlide(i, { imageFr: u })}
                />
                <SlideImage
                  label="Image de fond (AR) — optionnel"
                  url={slide.imageAr}
                  onChange={(u) => setSlide(i, { imageAr: u })}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Titre arabe (grand)</label>
                  <input dir="rtl" className={inputCls} value={slide.titleAr} onChange={(e) => setSlide(i, { titleAr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Titre français</label>
                  <input className={inputCls} value={slide.titleFr} onChange={(e) => setSlide(i, { titleFr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Sous-titre arabe</label>
                  <input dir="rtl" className={inputCls} value={slide.subtitleAr} onChange={(e) => setSlide(i, { subtitleAr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Sous-titre français</label>
                  <input className={inputCls} value={slide.subtitleFr} onChange={(e) => setSlide(i, { subtitleFr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Texte bouton arabe</label>
                  <input dir="rtl" className={inputCls} value={slide.buttonTextAr} onChange={(e) => setSlide(i, { buttonTextAr: e.target.value })} placeholder="اكتشفوا" />
                </div>
                <div>
                  <label className={labelCls}>Texte bouton français</label>
                  <input className={inputCls} value={slide.buttonTextFr} onChange={(e) => setSlide(i, { buttonTextFr: e.target.value })} placeholder="Découvrir" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Lien du bouton</label>
                  <input className={inputCls} value={slide.buttonLink} onChange={(e) => setSlide(i, { buttonLink: e.target.value })} placeholder="/catalogue" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tuiles catégories (titre / description / lien / image, FR/AR/EN) */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Tuiles catégories</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">
          Grille de 4 tuiles sous le slider. Dès qu’une image est définie, la grille luxe
          remplace la grille catégories classique. Titre/description vides → valeurs par défaut.
        </p>

        <div className="space-y-5">
          {form.categoryGrid.map((tile, i) => (
            <div key={tile.key} className="border border-[var(--bordure)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--vert-fonce)]">
                {CATEGORY_LABELS[tile.key] ?? tile.key}
              </p>

              <SlideImage
                label="Image"
                url={tile.imageFr}
                onChange={(u) => setTile(i, { imageFr: u })}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Titre FR</label>
                  <input className={inputCls} value={tile.titleFr} onChange={(e) => setTile(i, { titleFr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Titre AR</label>
                  <input dir="rtl" className={inputCls} value={tile.titleAr} onChange={(e) => setTile(i, { titleAr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Titre EN</label>
                  <input className={inputCls} value={tile.titleEn} onChange={(e) => setTile(i, { titleEn: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Description FR</label>
                  <input className={inputCls} value={tile.descriptionFr} onChange={(e) => setTile(i, { descriptionFr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Description AR</label>
                  <input dir="rtl" className={inputCls} value={tile.descriptionAr} onChange={(e) => setTile(i, { descriptionAr: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Description EN</label>
                  <input className={inputCls} value={tile.descriptionEn} onChange={(e) => setTile(i, { descriptionEn: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <label className={labelCls}>Lien</label>
                  <input className={inputCls} value={tile.link} onChange={(e) => setTile(i, { link: e.target.value })} placeholder="/catalogue/chapelet" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Produits mis en avant */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Produits mis en avant</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">
          Sélection affichée dans la section « Best-sellers ». Si vide, les produits marqués
          « En vedette » sont utilisés.
        </p>

        <label className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.featuredSliderEnabled}
            onChange={(e) => set('featuredSliderEnabled', e.target.checked)}
            className="h-4 w-4 accent-[var(--vert-fonce)]"
          />
          <span className="text-sm text-[var(--texte)]">
            Activer le slider produits vedettes{' '}
            <span className="text-[var(--texte-doux)]">(carrousel horizontal au lieu de la grille best-sellers)</span>
          </span>
        </label>
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
