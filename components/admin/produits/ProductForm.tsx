'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatMad } from '@/lib/utils/price'
import { upsertProductAction } from '@/app/admin/(panel)/actions'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'

export interface CategoryOption {
  id: string
  nameFr: string
}

export interface VariantRow {
  nameFr: string
  nameAr: string
  nameEn: string
  sku: string
  priceMad: string
  stock: string
}

export interface ProductInitial {
  id?: string
  slug: string
  sku: string
  nameFr: string
  nameAr: string
  nameEn: string
  descriptionFr: string
  descriptionAr: string
  descriptionEn: string
  shortDescFr: string
  shortDescAr: string
  shortDescEn: string
  priceMad: string
  priceEur: string
  comparePriceMad: string
  categoryId: string
  type: string
  status: string
  images: string[]
  stock: string
  lowStockThreshold: string
  weightG: string
  dimensions: string
  materialFr: string
  materialAr: string
  materialEn: string
  tags: string
  metaTitleFr: string
  metaDescriptionFr: string
  isFeatured: boolean
  isNew: boolean
  variants: VariantRow[]
}

export const EMPTY_PRODUCT: ProductInitial = {
  slug: '', sku: '', nameFr: '', nameAr: '', nameEn: '',
  descriptionFr: '', descriptionAr: '', descriptionEn: '',
  shortDescFr: '', shortDescAr: '', shortDescEn: '',
  priceMad: '', priceEur: '', comparePriceMad: '',
  categoryId: '', type: 'PHYSICAL', status: 'DRAFT',
  images: [], stock: '0', lowStockThreshold: '5',
  weightG: '', dimensions: '', materialFr: '', materialAr: '', materialEn: '',
  tags: '', metaTitleFr: '', metaDescriptionFr: '',
  isFeatured: false, isNew: false, variants: [],
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const LANGS = ['fr', 'ar', 'en'] as const
type Lang = (typeof LANGS)[number]
const LANG_LABELS: Record<Lang, string> = { fr: 'Français', ar: 'العربية', en: 'English' }

const inputCls = 'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductInitial
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<ProductInitial>(initial)
  const [lang, setLang] = useState<Lang>('fr')
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ProductInitial>(key: K, value: ProductInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addVariant = () =>
    set('variants', [...form.variants, { nameFr: '', nameAr: '', nameEn: '', sku: '', priceMad: '', stock: '0' }])
  const updateVariant = (i: number, key: keyof VariantRow, value: string) => {
    const next = [...form.variants]
    next[i] = { ...next[i], [key]: value }
    set('variants', next)
  }
  const removeVariant = (i: number) => set('variants', form.variants.filter((_, idx) => idx !== i))

  const numOrUndef = (v: string) => (v.trim() && Number(v) > 0 ? Number(v) : undefined)
  const strOrUndef = (v: string) => (v.trim() ? v.trim() : undefined)

  const submit = () => {
    setError(null)
    const payload = {
      slug: form.slug.trim() || slugify(form.nameFr),
      sku: strOrUndef(form.sku),
      nameFr: form.nameFr, nameAr: form.nameAr, nameEn: form.nameEn,
      descriptionFr: form.descriptionFr, descriptionAr: form.descriptionAr, descriptionEn: form.descriptionEn,
      shortDescFr: strOrUndef(form.shortDescFr), shortDescAr: strOrUndef(form.shortDescAr), shortDescEn: strOrUndef(form.shortDescEn),
      priceMad: Number(form.priceMad),
      priceEur: numOrUndef(form.priceEur),
      comparePriceMad: numOrUndef(form.comparePriceMad),
      categoryId: form.categoryId,
      images: form.images,
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      weightG: numOrUndef(form.weightG),
      dimensions: strOrUndef(form.dimensions),
      materialFr: strOrUndef(form.materialFr), materialAr: strOrUndef(form.materialAr), materialEn: strOrUndef(form.materialEn),
      status: form.status, type: form.type,
      isFeatured: form.isFeatured, isNew: form.isNew,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      metaTitleFr: strOrUndef(form.metaTitleFr),
      metaDescriptionFr: strOrUndef(form.metaDescriptionFr),
      variants: form.variants.map((v) => ({
        nameFr: v.nameFr || 'Standard',
        nameAr: v.nameAr || v.nameFr || 'قياسي',
        nameEn: v.nameEn || v.nameFr || 'Standard',
        sku: strOrUndef(v.sku),
        priceMad: Number(v.priceMad) || Number(form.priceMad) || 0,
        stock: Number(v.stock) || 0,
        attributes: {},
        isActive: true,
      })),
    }

    if (!payload.nameFr || !payload.priceMad || !payload.categoryId) {
      setError('Nom FR, prix MAD et catégorie sont obligatoires.')
      return
    }

    startTransition(async () => {
      const res = await upsertProductAction(form.id ?? null, payload)
      if (res.ok) {
        router.push('/admin/produits')
        router.refresh()
      } else {
        setError(res.error ?? 'Erreur')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Colonne formulaire */}
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-[var(--erreur)]/40 bg-[color-mix(in_srgb,var(--erreur)_8%,transparent)] px-4 py-3 text-sm text-[var(--erreur)]">{error}</div>
        )}

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
                <label className={labelCls}>Nom ({l.toUpperCase()})</label>
                <input className={inputCls} value={form[`name${cap(l)}` as keyof ProductInitial] as string}
                  onChange={(e) => set(`name${cap(l)}` as keyof ProductInitial, e.target.value as never)} />
              </div>
              <div>
                <label className={labelCls}>Description courte ({l.toUpperCase()})</label>
                <input className={inputCls} value={form[`shortDesc${cap(l)}` as keyof ProductInitial] as string}
                  onChange={(e) => set(`shortDesc${cap(l)}` as keyof ProductInitial, e.target.value as never)} />
              </div>
              <div>
                <label className={labelCls}>Description complète ({l.toUpperCase()})</label>
                <textarea rows={5} className={`${inputCls} resize-y`} value={form[`description${cap(l)}` as keyof ProductInitial] as string}
                  onChange={(e) => set(`description${cap(l)}` as keyof ProductInitial, e.target.value as never)} />
              </div>
              <div>
                <label className={labelCls}>Matériaux ({l.toUpperCase()})</label>
                <input className={inputCls} value={form[`material${cap(l)}` as keyof ProductInitial] as string}
                  onChange={(e) => set(`material${cap(l)}` as keyof ProductInitial, e.target.value as never)} />
              </div>
            </div>
          ))}
        </section>

        {/* Prix & catégorie */}
        <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Tarification & classement</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><label className={labelCls}>Prix MAD *</label><input type="number" className={inputCls} value={form.priceMad} onChange={(e) => set('priceMad', e.target.value)} /></div>
            <div><label className={labelCls}>Prix EUR</label><input type="number" className={inputCls} value={form.priceEur} onChange={(e) => set('priceEur', e.target.value)} /></div>
            <div><label className={labelCls}>Prix comparé MAD</label><input type="number" className={inputCls} value={form.comparePriceMad} onChange={(e) => set('comparePriceMad', e.target.value)} /></div>
            <div className="col-span-2 sm:col-span-1">
              <label className={labelCls}>Catégorie *</label>
              <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">— Choisir —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="PHYSICAL">Physique</option>
                <option value="DIGITAL">Numérique</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Statut</label>
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="DRAFT">Brouillon</option>
                <option value="ACTIVE">Actif</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--texte)]">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Mis en avant
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--texte)]">
              <input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} /> Nouveauté
            </label>
          </div>
        </section>

        {/* Images */}
        <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Images</h3>
          <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
        </section>

        {/* Inventaire */}
        <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">Inventaire & logistique</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} /></div>
            <div><label className={labelCls}>Slug</label><input className={inputCls} value={form.slug} onChange={(e) => set('slug', e.target.value)} onBlur={() => { if (!form.slug && form.nameFr) set('slug', slugify(form.nameFr)) }} /></div>
            <div><label className={labelCls}>Stock</label><input type="number" className={inputCls} value={form.stock} onChange={(e) => set('stock', e.target.value)} /></div>
            <div><label className={labelCls}>Seuil alerte</label><input type="number" className={inputCls} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} /></div>
            <div><label className={labelCls}>Poids (g)</label><input type="number" className={inputCls} value={form.weightG} onChange={(e) => set('weightG', e.target.value)} /></div>
            <div><label className={labelCls}>Dimensions</label><input className={inputCls} value={form.dimensions} placeholder="L×l×h cm" onChange={(e) => set('dimensions', e.target.value)} /></div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>Tags (séparés par virgule)</label>
            <input className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="berbère, fait main, laine" />
          </div>
        </section>

        {/* SEO */}
        <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <h3 className="mb-4 font-titre text-lg text-[var(--vert-fonce)]">SEO (FR)</h3>
          <div className="space-y-4">
            <div><label className={labelCls}>Méta-titre</label><input className={inputCls} maxLength={70} value={form.metaTitleFr} onChange={(e) => set('metaTitleFr', e.target.value)} /></div>
            <div><label className={labelCls}>Méta-description</label><textarea rows={2} maxLength={160} className={`${inputCls} resize-y`} value={form.metaDescriptionFr} onChange={(e) => set('metaDescriptionFr', e.target.value)} /></div>
          </div>
        </section>

        {/* Variants */}
        <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-titre text-lg text-[var(--vert-fonce)]">Variantes</h3>
            <button type="button" onClick={addVariant} className="border border-[var(--bordure)] px-3 py-1.5 text-xs uppercase tracking-[0.1em]">+ Ajouter</button>
          </div>
          {form.variants.length === 0 ? (
            <p className="text-sm text-[var(--texte-doux)]">Aucune variante.</p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <input className={inputCls} placeholder="Nom FR" value={v.nameFr} onChange={(e) => updateVariant(i, 'nameFr', e.target.value)} />
                  <input className={inputCls} placeholder="Nom AR" value={v.nameAr} onChange={(e) => updateVariant(i, 'nameAr', e.target.value)} />
                  <input className={inputCls} placeholder="Nom EN" value={v.nameEn} onChange={(e) => updateVariant(i, 'nameEn', e.target.value)} />
                  <input className={inputCls} placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} />
                  <input className={inputCls} type="number" placeholder="Prix" value={v.priceMad} onChange={(e) => updateVariant(i, 'priceMad', e.target.value)} />
                  <div className="flex gap-1">
                    <input className={inputCls} type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} />
                    <button type="button" onClick={() => removeVariant(i)} className="shrink-0 border border-[var(--bordure)] px-2 text-[var(--erreur)]">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex gap-3">
          <button type="button" onClick={submit} disabled={pending} className="bg-[var(--vert-fonce)] px-6 py-3 text-xs uppercase tracking-[0.14em] text-[var(--creme)] disabled:opacity-50">
            {pending ? 'Enregistrement…' : form.id ? 'Mettre à jour' : 'Créer le produit'}
          </button>
          <button type="button" onClick={() => router.push('/admin/produits')} className="border border-[var(--bordure)] px-6 py-3 text-xs uppercase tracking-[0.14em] text-[var(--texte)]">
            Annuler
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">Aperçu</p>
        <div className="border border-[var(--bordure)] bg-[var(--blanc)]">
          <div className="aspect-[4/5] w-full overflow-hidden bg-[var(--gris-perle)]">
            {form.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--texte-doux)]">Pas d&apos;image</div>
            )}
          </div>
          <div className="p-4">
            <p className="font-titre text-lg text-[var(--vert-fonce)]">{form.nameFr || 'Nom du produit'}</p>
            {form.shortDescFr && <p className="mt-1 line-clamp-2 text-sm text-[var(--texte-doux)]">{form.shortDescFr}</p>}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg text-[var(--vert-fonce)]">{form.priceMad ? formatMad(Number(form.priceMad)) : '—'}</span>
              {form.comparePriceMad && Number(form.comparePriceMad) > Number(form.priceMad) && (
                <span className="text-sm text-[var(--texte-doux)] line-through">{formatMad(Number(form.comparePriceMad))}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-[var(--texte-doux)]">Stock : {form.stock || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function cap(l: Lang): 'Fr' | 'Ar' | 'En' {
  return (l.charAt(0).toUpperCase() + l.slice(1)) as 'Fr' | 'Ar' | 'En'
}

export default ProductForm
