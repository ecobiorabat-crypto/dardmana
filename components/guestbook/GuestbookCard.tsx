'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { RatingStars } from '@/components/ui/RatingStars'
import { relativeTime } from '@/lib/utils/relative-time'
import { cn } from '@/lib/utils/cn'

export type GuestbookSource = 'WEBSITE' | 'WHATSAPP' | 'TIKTOK' | 'INSTAGRAM'
export type GuestbookMediaType = 'PHOTO' | 'VIDEO'

export interface GuestbookEntryDTO {
  id: string
  customerName: string
  customerCity: string | null
  customerCountry: string | null
  message: string
  rating: number | null
  mediaUrl: string | null
  mediaType: GuestbookMediaType | null
  productTag: string | null
  source: GuestbookSource
  likesCount: number
  isVerifiedBuyer: boolean
  isFeatured: boolean
  createdAt: string
}

const LIKED_KEY = 'dd-guestbook-liked'

const SOURCE_STYLE: Record<GuestbookSource, string> = {
  TIKTOK: 'bg-[#14130f] text-white',
  WHATSAPP: 'bg-[#25D366] text-white',
  INSTAGRAM: 'bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white',
  WEBSITE: 'bg-[var(--gris-perle)] text-[var(--texte)]',
}

function readLiked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? '?'
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export function GuestbookCard({ entry, locale }: { entry: GuestbookEntryDTO; locale: string }) {
  const t = useTranslations('Guestbook')
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(entry.likesCount)

  useEffect(() => {
    setLiked(readLiked().includes(entry.id))
  }, [entry.id])

  async function handleLike() {
    if (liked) return
    // Optimiste + persistance locale (1 like / navigateur).
    setLiked(true)
    setCount((c) => c + 1)
    try {
      const current = readLiked()
      if (!current.includes(entry.id)) {
        localStorage.setItem(LIKED_KEY, JSON.stringify([...current, entry.id]))
      }
    } catch {
      /* localStorage indisponible — on garde l'état optimiste */
    }
    try {
      const res = await fetch(`/api/guestbook/${entry.id}/like`, { method: 'POST' })
      const data = (await res.json()) as { likesCount?: number }
      if (res.ok && typeof data.likesCount === 'number') setCount(data.likesCount)
    } catch {
      /* on conserve l'incrément optimiste */
    }
  }

  const isVideo = entry.mediaType === 'VIDEO'

  return (
    <figure className="flex break-inside-avoid flex-col border border-[var(--bordure)] bg-[var(--blanc)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-titre text-sm text-[var(--creme)]"
          style={{ background: 'linear-gradient(135deg, var(--vert-fonce), var(--or-royal))' }}
          aria-hidden="true"
        >
          {initials(entry.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-[var(--texte)]">{entry.customerName}</p>
            {entry.isVerifiedBuyer && (
              <span title={t('verifiedBuyer')} className="text-[var(--vert-moyen)]" aria-label={t('verifiedBuyer')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.4 1.8 3-.2 1 2.8 2.6 1.4-.8 2.9.8 2.9-2.6 1.4-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3 16.2l.8-2.9L3 10.4l2.6-1.4 1-2.8 3 .2L12 2z" />
                  <path d="M8.5 12l2.2 2.2 4.3-4.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
          {entry.customerCity && (
            <p className="truncate text-xs text-[var(--texte-doux)]">{entry.customerCity}</p>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wide',
            SOURCE_STYLE[entry.source],
          )}
        >
          {t(`source${entry.source}`)}
        </span>
      </div>

      {/* Rating */}
      {entry.rating ? (
        <div className="px-5 pt-3">
          <RatingStars rating={entry.rating} size="sm" />
        </div>
      ) : null}

      {/* Message */}
      <blockquote className="px-5 py-4 text-sm leading-relaxed text-[var(--texte)]">
        {entry.message}
        {entry.productTag && (
          <span className="mt-2 block font-titre text-sm italic text-[var(--or-royal)]">
            ✦ {t('aboutProduct')} <span className="not-italic">·</span> <em>{entry.productTag}</em>
          </span>
        )}
      </blockquote>

      {/* Média */}
      {entry.mediaUrl && (
        <div className="relative mx-5 mb-4 aspect-square overflow-hidden bg-[var(--gris-perle)]">
          {isVideo ? (
            <video
              src={entry.mediaUrl}
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={entry.mediaUrl}
              alt={entry.productTag ?? entry.customerName}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-cover"
            />
          )}
          {isVideo && (
            <span className="pointer-events-none absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          )}
          {entry.productTag && (
            <span className="absolute bottom-2 start-2 max-w-[80%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[0.65rem] text-white">
              {entry.productTag}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <figcaption className="mt-auto flex items-center justify-between border-t border-[var(--bordure)] px-5 py-3">
        <time className="text-xs text-[var(--texte-doux)]" dateTime={entry.createdAt}>
          {relativeTime(entry.createdAt, locale)}
        </time>
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={t('likeAria')}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm transition-colors',
            liked ? 'text-[var(--erreur)]' : 'text-[var(--texte-doux)] hover:text-[var(--erreur)]',
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} aria-hidden="true">
            <path
              d="M12 20s-7-4.35-9.2-8.3C1.3 8.9 2.6 5.8 5.6 5.2c1.9-.4 3.5.6 4.4 2 .9-1.4 2.5-2.4 4.4-2 3 .6 4.3 3.7 2.8 6.5C19 15.65 12 20 12 20z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {count}
        </button>
      </figcaption>
    </figure>
  )
}

export default GuestbookCard
