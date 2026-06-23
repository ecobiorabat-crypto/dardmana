'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'
import { cn } from '@/lib/utils/cn'
import type { AdminGuestbookEntry } from './GuestbookModeration'

const inputCls =
  'w-full border border-[var(--bordure)] px-3 py-2 text-sm outline-none focus:border-[var(--or-royal)]'
const labelCls = 'mb-1 block text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]'

const SOURCES = ['WEBSITE', 'WHATSAPP', 'TIKTOK', 'INSTAGRAM'] as const
type Source = (typeof SOURCES)[number]
const SOURCE_LABELS: Record<Source, string> = {
  WEBSITE: 'Site web',
  WHATSAPP: 'WhatsApp',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value ?? 0
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            'text-2xl leading-none transition-colors',
            n <= display ? 'text-[var(--or-royal)]' : 'text-[var(--bordure)]',
          )}
        >
          ★
        </button>
      ))}
      <span className="ms-2 text-xs text-[var(--texte-doux)]">
        {value ? `${value}/5` : 'Aucune note'}
      </span>
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ms-1 text-xs text-[var(--texte-doux)] underline-offset-2 hover:underline"
        >
          effacer
        </button>
      )}
    </div>
  )
}

export function GuestbookEditForm({ entry }: { entry: AdminGuestbookEntry }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [customerName, setCustomerName] = useState(entry.customerName)
  const [customerCity, setCustomerCity] = useState(entry.customerCity ?? '')
  const [message, setMessage] = useState(entry.message)
  const [rating, setRating] = useState<number | null>(entry.rating)
  const [mediaUrl, setMediaUrl] = useState<string | null>(entry.mediaUrl)
  const [source, setSource] = useState<Source>(entry.source)
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(entry.isVerifiedBuyer)
  const [productTag, setProductTag] = useState(entry.productTag ?? '')

  function save(approve: boolean) {
    setNote(null)
    if (!customerName.trim()) {
      setNote({ type: 'err', text: 'Le nom du client est requis.' })
      return
    }
    if (!message.trim()) {
      setNote({ type: 'err', text: 'Le message est requis.' })
      return
    }

    const body: Record<string, unknown> = {
      customerName: customerName.trim(),
      customerCity: customerCity.trim() || null,
      message: message.trim(),
      rating,
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? (isVideoUrl(mediaUrl) ? 'VIDEO' : 'PHOTO') : null,
      source,
      isVerifiedBuyer,
      productTag: productTag.trim() || null,
    }
    if (approve) body.isApproved = true

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/guestbook/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Échec de l’enregistrement')
        // Retour à la liste avec un toast de succès.
        router.push('/admin/livre-dor?updated=1')
        router.refresh()
      } catch (err) {
        setNote({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' })
      }
    })
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

      <section className="space-y-4 border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelCls}>Nom du client</label>
            <input id="name" className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="city" className={labelCls}>Ville</label>
            <input id="city" className={inputCls} value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} placeholder="Casablanca" />
          </div>
        </div>

        <div>
          <label htmlFor="message" className={labelCls}>Message</label>
          <textarea id="message" rows={5} className={`${inputCls} resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div>
          <span className={labelCls}>Note</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="source" className={labelCls}>Source</label>
            <select id="source" className={inputCls} value={source} onChange={(e) => setSource(e.target.value as Source)}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tag" className={labelCls}>Produit associé (tag)</label>
            <input id="tag" className={inputCls} value={productTag} onChange={(e) => setProductTag(e.target.value)} placeholder="Chapelet oud salib" />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isVerifiedBuyer}
            onChange={(e) => setIsVerifiedBuyer(e.target.checked)}
            className="h-4 w-4 accent-[var(--vert-fonce)]"
          />
          <span className="text-sm text-[var(--texte)]">
            Achat vérifié <span className="text-[var(--texte-doux)]">(badge « acheteur vérifié »)</span>
          </span>
        </label>
      </section>

      {/* Média */}
      <section className="border border-[var(--bordure)] bg-[var(--blanc)] p-5">
        <h3 className="mb-1 font-titre text-lg text-[var(--vert-fonce)]">Image / vidéo</h3>
        <p className="mb-4 text-xs text-[var(--texte-doux)]">Média affiché avec le témoignage (optionnel).</p>

        {mediaUrl ? (
          <div className="mb-4 flex items-start gap-4">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded border border-[var(--bordure)] bg-[var(--gris-perle)]">
              {isVideoUrl(mediaUrl) ? (
                <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt="Aperçu du média" className="h-full w-full object-cover" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setMediaUrl(null)}
              className="border border-[var(--erreur)]/50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--erreur)] transition-colors hover:bg-[var(--erreur)] hover:text-white"
            >
              Supprimer l'image
            </button>
          </div>
        ) : (
          <p className="mb-4 text-sm text-[var(--texte-doux)]">Aucun média.</p>
        )}

        <p className="mb-2 text-xs uppercase tracking-[0.1em] text-[var(--texte-doux)]">
          {mediaUrl ? "Changer l'image" : 'Ajouter une image'}
        </p>
        <ImageUploader
          images={[]}
          maxImages={1}
          allowVideo
          onChange={(imgs) => {
            const url = imgs[imgs.length - 1]
            if (url) setMediaUrl(url)
          }}
        />
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--bordure)] pt-6">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={pending}
          className="bg-[var(--vert-fonce)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-[var(--creme)] transition-colors hover:bg-[var(--vert-moyen)] disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        {!entry.isApproved && (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={pending}
            className="border border-[var(--vert-moyen)] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-moyen)] transition-colors hover:bg-[var(--vert-moyen)] hover:text-white disabled:opacity-50"
          >
            ✓ Enregistrer et approuver
          </button>
        )}
        <Link href="/admin/livre-dor" className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline">
          Annuler
        </Link>
      </div>
    </div>
  )
}

export default GuestbookEditForm
