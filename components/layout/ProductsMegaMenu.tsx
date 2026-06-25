'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { localizedHref, useCurrentLocale } from './nav'
import { useCategories, categoryName } from './useCategories'
import { DEFAULT_NAV_CONFIG, isLinkEnabled, type NavConfig } from '@/lib/nav-config-types'
import { cn } from '@/lib/utils/cn'

/**
 * Lien « Produits » de la navbar (desktop) + mega-menu de catégories au survol.
 *
 * Le panneau est rendu via createPortal sur document.body en position: fixed
 * (z-index 9999), positionné sous le trigger via getBoundingClientRect — il
 * échappe ainsi à TOUS les stacking contexts parents (header, filter, transform).
 * Fermeture : scroll, resize, clic extérieur, Échap.
 */
export function ProductsMegaMenu({
  label,
  href,
  navConfig = DEFAULT_NAV_CONFIG,
}: {
  label: string
  href: string
  navConfig?: NavConfig
}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLLIElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setMounted(true), [])

  // Calcule la position du panneau sous le trigger, en gardant le panneau
  // dans la fenêtre (clamp horizontal).
  const computePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const panelWidth = Math.min(560, Math.max(320, window.innerWidth * 0.42))
    const half = panelWidth / 2
    const margin = 12
    let centerX = rect.left + rect.width / 2
    centerX = Math.max(margin + half, Math.min(centerX, window.innerWidth - margin - half))
    setCoords({ top: rect.bottom, left: centerX })
  }, [])

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = useCallback(() => {
    clearCloseTimer()
    computePosition()
    setOpen(true)
  }, [computePosition])

  // Léger délai pour permettre au curseur de passer du trigger au panneau
  // (qui est portalé, donc hors du <li>).
  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }, [])

  const closeNow = useCallback(() => {
    clearCloseTimer()
    setOpen(false)
  }, [])

  // Fermeture : scroll, resize, clic extérieur, Échap.
  useEffect(() => {
    if (!open) return
    const onScroll = () => closeNow()
    const onResize = () => closeNow()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeNow()
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (document.getElementById('products-mega-panel')?.contains(target)) return
      closeNow()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, closeNow])

  // Nettoyage du timer au démontage.
  useEffect(() => () => clearCloseTimer(), [])

  const panel =
    open && mounted
      ? createPortal(
          <div
            id="products-mega-panel"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: 'translateX(-50%)',
              zIndex: 9999,
            }}
            className="pt-3"
          >
            <div className="w-[clamp(320px,42vw,560px)] rounded-[12px] bg-[var(--blanc)] p-4 text-[var(--texte)] shadow-[0_20px_50px_-15px_rgba(20,19,15,0.28)] ring-1 ring-[var(--bordure)]">
              {categories.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--texte-doux)]">
                  {t('Products.empty')}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={localizedHref(locale, `/catalogue/${c.slug}`)}
                      onClick={closeNow}
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

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--bordure)] pt-3">
                {isLinkEnabled(navConfig, '/best-sellers') && (
                  <Link
                    href={localizedHref(locale, '/best-sellers')}
                    onClick={closeNow}
                    className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--or-royal)] transition-colors hover:text-[var(--vert-fonce)]"
                  >
                    ⭐ {t('BestSellers.metaTitle')}
                  </Link>
                )}
                {isLinkEnabled(navConfig, '/editions-limitees') && (
                  <Link
                    href={localizedHref(locale, '/editions-limitees')}
                    onClick={closeNow}
                    className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--erreur)] transition-colors hover:text-[var(--vert-fonce)]"
                  >
                    🔥 {t('LimitedEditions.metaTitle')}
                  </Link>
                )}
                <Link
                  href={localizedHref(locale, '/catalogue')}
                  onClick={closeNow}
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--vert-fonce)] transition-colors hover:text-[var(--or-royal)]"
                >
                  {t('Nav.allCatalogue')}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <li ref={triggerRef} className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <Link
        href={localizedHref(locale, href)}
        aria-haspopup="true"
        aria-expanded={open}
        onFocus={openMenu}
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
      {panel}
    </li>
  )
}

export default ProductsMegaMenu
