'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { localizedHref, useCurrentLocale } from './nav'
import { useCategories, categoryName } from './useCategories'
import { cn } from '@/lib/utils/cn'

/**
 * Lien « Produits » de la navbar (desktop) avec mega-menu déroulant des
 * catégories au survol. Fermeture au mouseleave, clic extérieur ou Échap.
 */
export function ProductsMegaMenu({ label, href }: { label: string; href: string }) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)

  // Fermeture : clic en dehors + touche Échap.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <li
      ref={ref}
      className="relative z-50"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={localizedHref(locale, href)}
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        className={cn(
          'relative inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-current',
          'after:absolute after:-bottom-1.5 after:start-0 after:h-px after:w-0 after:bg-[var(--or-royal)]',
          'after:transition-all after:duration-300 hover:after:w-full',
        )}
      >
        {label}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            // pt-3 crée l'espace visuel SANS zone morte (le survol reste continu).
            className="absolute start-1/2 top-full z-[60] -translate-x-1/2 pt-3"
          >
            <div className="w-[clamp(420px,42vw,560px)] rounded-[12px] bg-[var(--blanc)] p-4 text-[var(--texte)] shadow-[0_20px_50px_-15px_rgba(20,19,15,0.28)] ring-1 ring-[var(--bordure)]">
              {categories.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--texte-doux)]">
                  {t('Products.empty')}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={localizedHref(locale, `/catalogue/${c.slug}`)}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#f0f7f2] hover:text-[var(--vert-fonce)]"
                    >
                      <span className="text-xl leading-none" aria-hidden="true">{c.icon || '🛍️'}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium normal-case tracking-normal">
                          {categoryName(c, locale)}
                        </span>
                        <span className="block text-xs text-[var(--texte-doux)]">
                          {c.count} {c.count > 1 ? 'produits' : 'produit'}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href={localizedHref(locale, '/catalogue')}
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-1.5 border-t border-[var(--bordure)] pt-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:text-[var(--or-royal)]"
              >
                {t('Nav.allCatalogue')}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export default ProductsMegaMenu
