'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { GuestbookCard, type GuestbookEntryDTO } from './GuestbookCard'
import { cn } from '@/lib/utils/cn'

const VIDEOS_FILTER = '__videos__'

export interface CategoryOption {
  label: string
  value: string
}

export interface GuestbookFeedProps {
  initialEntries: GuestbookEntryDTO[]
  initialTotalPages: number
  categories: CategoryOption[]
  hasVideos: boolean
  locale: string
}

export function GuestbookFeed({
  initialEntries,
  initialTotalPages,
  categories,
  hasVideos,
  locale,
}: GuestbookFeedProps) {
  const t = useTranslations('Guestbook')
  const [entries, setEntries] = useState<GuestbookEntryDTO[]>(initialEntries)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const buildUrl = useCallback((nextPage: number, activeFilter: string) => {
    const q = new URLSearchParams({ page: String(nextPage) })
    if (activeFilter === VIDEOS_FILTER) q.set('videos', 'true')
    else if (activeFilter !== 'all') q.set('category', activeFilter)
    return `/api/guestbook?${q.toString()}`
  }, [])

  const applyFilter = useCallback(
    async (next: string) => {
      if (next === filter) return
      setFilter(next)
      setLoading(true)
      try {
        const res = await fetch(buildUrl(1, next))
        const data = await res.json()
        setEntries(Array.isArray(data.entries) ? data.entries : [])
        setTotalPages(Number(data.totalPages) || 1)
        setPage(1)
      } catch {
        setEntries([])
      } finally {
        setLoading(false)
      }
    },
    [filter, buildUrl],
  )

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(page + 1, filter))
      const data = await res.json()
      setEntries((prev) => [...prev, ...(Array.isArray(data.entries) ? data.entries : [])])
      setPage((p) => p + 1)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [buildUrl, page, filter])

  const pills: CategoryOption[] = [
    { label: t('filterAll'), value: 'all' },
    ...categories,
    ...(hasVideos ? [{ label: t('filterVideos'), value: VIDEOS_FILTER }] : []),
  ]

  return (
    <div>
      {/* Filtres horizontaux scrollables */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pills.map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => applyFilter(pill.value)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors',
              filter === pill.value
                ? 'border-[var(--vert-fonce)] bg-[var(--vert-fonce)] text-[var(--creme)]'
                : 'border-[var(--bordure)] text-[var(--texte)] hover:border-[var(--or-royal)]',
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Feed masonry */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--bordure)] py-20 text-center">
          <p className="font-titre text-2xl text-[var(--vert-fonce)]">{t('empty')}</p>
          <p className="max-w-sm text-sm text-[var(--texte-doux)]">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {entries.map((entry) => (
            <div key={entry.id} className="mb-5 break-inside-avoid">
              <GuestbookCard entry={entry} locale={locale} />
            </div>
          ))}
        </div>
      )}

      {/* Charger plus */}
      {page < totalPages && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="border border-[var(--vert-fonce)] px-8 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--creme)] disabled:opacity-50"
          >
            {loading ? t('submitting') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}

export default GuestbookFeed
