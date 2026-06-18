'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ImageUploader } from '@/components/admin/produits/ImageUploader'
import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils/cn'

export interface ProductOption {
  value: string
  label: string
}

const inputCls =
  'w-full border-0 border-b border-[var(--bordure)] bg-transparent py-3 text-[0.95rem] text-[var(--texte)] outline-none transition-colors focus:border-[var(--or-royal)]'
const labelCls = 'mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--texte-doux)]'

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

export function GuestbookForm({ products }: { products: ProductOption[] }) {
  const t = useTranslations('Guestbook')
  const showToast = useUiStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [product, setProduct] = useState('')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [message, setMessage] = useState('')
  const [media, setMedia] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({})

  function reset() {
    setName('')
    setCity('')
    setProduct('')
    setRating(0)
    setMessage('')
    setMedia([])
    setErrors({})
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors: { name?: string; message?: string } = {}
    if (name.trim().length < 2) nextErrors.name = t('fieldName')
    if (message.trim().length < 10) nextErrors.message = t('fieldMessage')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const mediaUrl = media[0]
    setLoading(true)
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerCity: city.trim() || undefined,
          message: message.trim(),
          rating: rating || undefined,
          productTag: product || undefined,
          mediaUrl: mediaUrl || undefined,
          mediaType: mediaUrl ? (isVideoUrl(mediaUrl) ? 'VIDEO' : 'PHOTO') : undefined,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setSubmitted(true)
      reset()
    } catch {
      showToast(t('errorGeneric'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 border border-[var(--bordure)] bg-[var(--creme)] px-6 py-14 text-center">
        <span className="text-4xl">🤍</span>
        <p className="max-w-md font-titre text-xl text-[var(--vert-fonce)]">{t('successMessage')}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-[var(--texte-doux)] underline-offset-2 hover:underline"
        >
          {t('ctaButton')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="gb-name" className={labelCls}>
            {t('fieldName')} <span aria-hidden="true">*</span>
          </label>
          <input
            id="gb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className={cn(inputCls, errors.name && 'border-[var(--erreur)]')}
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--erreur)]">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="gb-city" className={labelCls}>
            {t('fieldCity')}
          </label>
          <input
            id="gb-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={loading}
            className={inputCls}
          />
        </div>
      </div>

      {/* Produit */}
      <div>
        <label htmlFor="gb-product" className={labelCls}>
          {t('fieldProduct')}
        </label>
        <select
          id="gb-product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          disabled={loading}
          className={cn(inputCls, 'cursor-pointer', !product && 'text-[var(--texte-doux)]')}
        >
          <option value="">{t('fieldProductNone')}</option>
          {products.map((p) => (
            <option key={p.value} value={p.value} className="text-[var(--texte)]">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Note interactive */}
      <div>
        <span className={labelCls}>{t('fieldRating')}</span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              aria-label={`${star}`}
              className="p-0.5 text-[var(--or-royal)] transition-transform hover:scale-110"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill={(hover || rating) >= star ? 'currentColor' : 'none'}
                aria-hidden="true"
              >
                <path
                  d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="gb-message" className={labelCls}>
          {t('fieldMessage')} <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="gb-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          maxLength={500}
          className={cn(inputCls, 'resize-y leading-relaxed', errors.message && 'border-[var(--erreur)]')}
        />
        {errors.message && <p className="mt-1 text-xs text-[var(--erreur)]">{errors.message}</p>}
      </div>

      {/* Média */}
      <div>
        <span className={labelCls}>{t('fieldMedia')}</span>
        <ImageUploader
          images={media}
          onChange={setMedia}
          maxImages={1}
          endpoint="/api/guestbook/upload"
          withCredentials={false}
          allowVideo
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--or-royal)] py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--noir)] transition-colors hover:bg-[var(--or-clair)] disabled:opacity-50"
      >
        {loading ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}

export default GuestbookForm
