'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

interface FaqItem {
  q: string
  a: string
}
interface FaqCategory {
  name: string
  items: FaqItem[]
}

export function FaqAccordion() {
  const t = useTranslations('Faq')
  const categories = t.raw('categories') as FaqCategory[]
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const normalized = query.trim().toLowerCase()

  // Filtrage en temps réel (question + réponse).
  const filtered = useMemo(() => {
    if (!normalized) return categories
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => it.q.toLowerCase().includes(normalized) || it.a.toLowerCase().includes(normalized),
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [categories, normalized])

  const hasResults = filtered.some((c) => c.items.length > 0)

  return (
    <div className="space-y-8">
      {/* Recherche */}
      <div className="relative">
        <svg className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--texte-doux)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full border border-[var(--bordure)] bg-[var(--blanc)] py-3 ps-10 pe-4 text-sm outline-none focus:border-[var(--or-royal)]"
        />
      </div>

      {!hasResults ? (
        <p className="border border-dashed border-[var(--bordure)] py-12 text-center text-sm text-[var(--texte-doux)]">
          {t('noResults')}
        </p>
      ) : (
        filtered.map((cat) => (
          <section key={cat.name}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--or-royal)]">
              {cat.name}
            </h2>
            <div className="divide-y divide-[var(--bordure)] border border-[var(--bordure)] bg-[var(--creme)]">
              {cat.items.map((item, idx) => {
                const id = `${cat.name}-${idx}`
                const open = openId === id
                return (
                  <div key={id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : id)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                    >
                      <span className={cn('text-sm font-medium', open ? 'text-[var(--vert-fonce)]' : 'text-[var(--texte)]')}>
                        {item.q}
                      </span>
                      <span
                        className={cn(
                          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-all duration-300',
                          open
                            ? 'rotate-45 border-[var(--vert-fonce)] text-[var(--vert-fonce)]'
                            : 'border-[var(--bordure)] text-[var(--texte-doux)]',
                        )}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-sm leading-relaxed text-[var(--texte-doux)]">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

export default FaqAccordion
