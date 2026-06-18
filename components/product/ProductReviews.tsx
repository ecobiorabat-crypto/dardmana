'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RatingStars } from '@/components/ui/RatingStars'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUiStore } from '@/store/ui'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface Review {
  id: string
  customerName: string
  customerCountry: string | null
  rating: number
  title: string | null
  content: string
  isVerified: boolean
  createdAt: string
}

export function ProductReviews({
  productId,
  initialAvg,
  initialCount,
}: {
  productId: string
  initialAvg: number
  initialCount: number
}) {
  const t = useTranslations()
  const showToast = useUiStore((s) => s.showToast)
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState(initialAvg)
  const [total, setTotal] = useState(initialCount)
  const [loggedIn, setLoggedIn] = useState(false)

  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/reviews?productId=${productId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? [])
        setTotal(d.total ?? 0)
        if (typeof d.avgRating === 'number' && d.avgRating > 0) setAvg(d.avgRating)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [productId])

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setLoggedIn(Boolean(data.user)))
      .catch(() => {})
  }, [])

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
    return { star, count, pct }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (content.trim().length < 10) {
      setError(t('Products.reviewMinLength'))
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: name,
          rating,
          title: title || undefined,
          content,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('Products.reviewSendError'))
      } else {
        showToast(data.message ?? t('Products.reviewSubmitted'), 'success')
        setName('')
        setTitle('')
        setContent('')
        setRating(5)
      }
    } catch {
      setError(t('Common.networkError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="avis" className="border-t border-[var(--bordure)] pt-12">
      <h2 className="font-titre text-2xl text-[var(--vert-fonce)] sm:text-3xl">
        {t('Products.customerReviews')}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">
        {/* Résumé */}
        <div>
          <div className="flex items-end gap-3">
            <span className="font-titre text-5xl text-[var(--vert-fonce)]">
              {avg.toFixed(1)}
            </span>
            <div className="pb-1">
              <RatingStars rating={avg} size="sm" />
              <p className="mt-1 text-xs text-[var(--texte-doux)]">{t('Products.reviewsCount', { count: total })}</p>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs text-[var(--texte-doux)]">
                <span className="w-6">{d.star}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--gris-perle)]">
                  <div className="h-full rounded-full bg-[var(--or-royal)]" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-6 text-end">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liste + formulaire */}
        <div>
          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--texte-doux)]">
              {t('Products.beFirstReview')}
            </p>
          ) : (
            <ul className="space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-[var(--bordure)] pb-6 last:border-0">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={r.rating} size="sm" />
                    {r.isVerified && (
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-[var(--vert-moyen)]">
                        {t('Products.verifiedPurchase')}
                      </span>
                    )}
                  </div>
                  {r.title && <p className="mt-2 text-sm font-medium text-[var(--texte)]">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-[var(--texte-doux)]">{r.content}</p>
                  <p className="mt-2 text-xs text-[var(--texte-doux)]">
                    {r.customerName}
                    {r.customerCountry ? ` · ${r.customerCountry}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Formulaire */}
          <div className="mt-10 border-t border-[var(--bordure)] pt-8">
            <h3 className="font-titre text-xl text-[var(--texte)]">{t('Products.leaveReview')}</h3>
            {loggedIn ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--texte-doux)]">{t('Products.yourRating')}</span>
                  <RatingStars rating={rating} interactive onChange={setRating} />
                </div>
                <Input label={t('Products.yourName')} value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label={t('Products.reviewTitleOptional')} value={title} onChange={(e) => setTitle(e.target.value)} />
                <div>
                  <label htmlFor="review-content" className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">
                    {t('Products.yourReview')}
                  </label>
                  <textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className={cn(
                      'w-full border border-[var(--bordure)] bg-transparent p-3 text-sm outline-none',
                      'focus:border-[var(--or-royal)]',
                    )}
                  />
                </div>
                {error && <p className="text-sm text-[var(--erreur)]">{error}</p>}
                <Button type="submit" variant="dark" size="md" loading={submitting}>
                  {t('Products.publishReview')}
                </Button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-[var(--texte-doux)]">
                {t('Products.reviewLoginPrompt')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductReviews
