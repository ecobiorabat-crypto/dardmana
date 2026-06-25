'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/ui'
import { NAV_LINKS, localizedHref, useCurrentLocale } from './nav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileCategoriesAccordion } from './MobileCategoriesAccordion'
import { DEFAULT_NAV_CONFIG, isLinkEnabled, type NavConfig } from '@/lib/nav-config-types'
import { cn } from '@/lib/utils/cn'

const SWIPE_CLOSE = 80

export function MobileMenu({ navConfig = DEFAULT_NAV_CONFIG }: { navConfig?: NavConfig } = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const isRtl = locale === 'ar'
  const open = useUiStore((s) => s.mobileMenuOpen)
  const setOpen = useUiStore((s) => s.setMobileMenuOpen)
  const [mounted, setMounted] = useState(false)

  const close = () => setOpen(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Fermeture par glissement vers le côté « start » (hors écran) :
    // gauche en LTR, droite en RTL.
    if (isRtl ? info.offset.x > SWIPE_CLOSE : info.offset.x < -SWIPE_CLOSE) close()
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] md:hidden">
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          />

          <motion.nav
            role="dialog"
            aria-modal="true"
            aria-label={t('Nav.menu')}
            initial={{ x: isRtl ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '100%' : '-100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={isRtl ? { left: 0, right: 0.4 } : { left: 0.4, right: 0 }}
            onDragEnd={onDragEnd}
            className={cn(
              'absolute start-0 top-0 flex h-full w-[82%] max-w-sm flex-col',
              'bg-[var(--creme)] shadow-[0_24px_60px_-20px_rgba(20,19,15,0.45)]',
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--bordure)] px-6 py-5">
              <span className="font-titre text-xl text-[var(--or-royal)]">{t('Common.brand')}</span>
              <button
                type="button"
                onClick={close}
                aria-label={t('Common.close')}
                className="text-[var(--texte-doux)] transition-colors hover:text-[var(--vert-fonce)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <ul className="flex flex-col px-2 py-4">
              {NAV_LINKS.filter((link) => isLinkEnabled(navConfig, link.href)).map((link) =>
                link.megaMenu ? (
                  <MobileCategoriesAccordion key={link.href} label={t(`Nav.${link.key}`)} onNavigate={close} />
                ) : (
                  <li key={link.href}>
                    <Link
                      href={localizedHref(locale, link.href)}
                      onClick={close}
                      className={cn(
                        'block px-4 py-3.5 font-titre text-lg text-[var(--vert-fonce)]',
                        'transition-colors duration-150 hover:text-[var(--or-royal)]',
                      )}
                    >
                      {t(`Nav.${link.key}`)}
                    </Link>
                  </li>
                ),
              )}
            </ul>

            <div className="mt-auto border-t border-[var(--bordure)] px-6 py-5">
              <LanguageSwitcher />
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default MobileMenu
