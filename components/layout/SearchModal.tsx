'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/ui'
import { formatMad } from '@/lib/utils/price'
import { trackSearch } from '@/lib/analytics/events'
import { localizedHref, useCurrentLocale } from './nav'
import { cn } from '@/lib/utils/cn'

interface SearchResult {
  id: string
  slug: string
  nameFr: string
  nameAr: string | null
  nameEn: string | null
  priceMad: number
  images: string[]
  category: { slug: string; nameFr: string } | null
}

const DEBOUNCE_MS = 300

function resultName(r: SearchResult, locale: string): string {
  if (locale === 'ar' && r.nameAr) return r.nameAr
  if (locale === 'en' && r.nameEn) return r.nameEn
  return r.nameFr
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const locale = useCurrentLocale()
  const t = useTranslations()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const goToResult = useCallback(
    (r: SearchResult) => {
      onClose()
      router.push(localizedHref(locale, `/produit/${r.slug}`))
    },
    [onClose, locale, router],
  )

  // Autofocus + verrouillage du scroll (aucun setState ici)
  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = overflow
    }
  }, [])

  // Debounce + appel API (les setState ont lieu dans des callbacks async)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        setResults(Array.isArray(data.results) ? data.results : [])
        setActive(-1)
        trackSearch(q)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  // Maintient l'élément actif visible
  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const el = listRef.current.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const handleChange = (value: string) => {
    setQuery(value)
    const q = value.trim()
    if (q.length < 2) {
      setResults([])
      setActive(-1)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && active >= 0 && results[active]) {
      e.preventDefault()
      goToResult(results[active])
    }
  }

  const trimmed = query.trim()

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t('Nav.search')}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative z-10 flex w-full flex-col bg-[var(--creme)]',
        'h-full sm:h-auto sm:mt-24 sm:max-w-2xl sm:max-h-[70vh] sm:border sm:border-[var(--bordure)]',
        'sm:shadow-[0_24px_60px_-20px_rgba(20,19,15,0.45)]',
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--bordure)] px-5 py-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[var(--texte-doux)]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('Search.productPlaceholder')}
          aria-label={t('Search.productPlaceholder')}
          className="flex-1 bg-transparent text-base text-[var(--texte)] outline-none placeholder:text-[var(--texte-doux)]"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Search.close')}
          className="text-[var(--texte-doux)] transition-colors hover:text-[var(--vert-fonce)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="px-5 py-6 text-sm text-[var(--texte-doux)]">{t('Search.searching')}</p>}

        {!loading && trimmed.length >= 2 && results.length === 0 && (
          <p className="px-5 py-6 text-sm text-[var(--texte-doux)]">
            {t('Search.noResultsQuery', { query: trimmed })}
          </p>
        )}

        {!loading && results.length > 0 && (
          <ul ref={listRef} role="listbox" aria-label={t('Search.results')}>
            {results.map((r, i) => (
              <li key={r.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goToResult(r)}
                  className={cn(
                    'flex w-full items-center gap-4 px-5 py-3 text-left transition-colors',
                    i === active ? 'bg-[var(--gris-perle)]' : 'hover:bg-[var(--gris-perle)]',
                  )}
                >
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-[var(--gris-perle)]">
                    {r.images?.[0] && (
                      <Image src={r.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--texte)]">
                      {resultName(r, locale)}
                    </p>
                    {r.category && (
                      <p className="truncate text-xs text-[var(--texte-doux)]">{r.category.nameFr}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm text-[var(--or-royal)]">
                    {formatMad(Number(r.priceMad))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export function SearchModal() {
  const open = useUiStore((s) => s.searchOpen)
  const setOpen = useUiStore((s) => s.setSearchOpen)
  const close = useCallback(() => setOpen(false), [setOpen])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <SearchPanel onClose={close} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default SearchModal
