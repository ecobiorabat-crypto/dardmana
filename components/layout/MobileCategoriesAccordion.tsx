'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { localizedHref, useCurrentLocale } from './nav'
import { useCategories, categoryName } from './useCategories'
import { cn } from '@/lib/utils/cn'

/**
 * Item « Produits » du menu mobile : accordéon cliquable qui déploie la liste
 * des catégories (icône + nom + nombre de produits + lien catalogue).
 */
export function MobileCategoriesAccordion({
  label,
  onNavigate,
}: {
  label: string
  onNavigate: () => void
}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const categories = useCategories()
  const [open, setOpen] = useState(false)

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 font-titre text-lg text-[var(--vert-fonce)] transition-colors hover:text-[var(--or-royal)]"
      >
        {label}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
            <ul className="ms-4 border-s border-[var(--bordure)] ps-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={localizedHref(locale, `/catalogue/${c.slug}`)}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--texte)] transition-colors hover:bg-[#f0f7f2] hover:text-[var(--vert-fonce)]"
                  >
                    <span className="text-lg leading-none" aria-hidden="true">{c.icon || '🛍️'}</span>
                    <span className="flex-1">{categoryName(c, locale)}</span>
                    <span className="text-xs text-[var(--texte-doux)]">{c.count}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={localizedHref(locale, '/catalogue')}
                  onClick={onNavigate}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--vert-fonce)] hover:text-[var(--or-royal)]"
                >
                  {t('Nav.allCatalogue')} <span aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export default MobileCategoriesAccordion
