'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export type DrawerPosition = 'right' | 'left' | 'bottom'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  position?: DrawerPosition
  title?: ReactNode
  /** Ferme au clic sur l'overlay (défaut : true). */
  closeOnOverlay?: boolean
  showClose?: boolean
  className?: string
}

const PANEL_LAYOUT: Record<DrawerPosition, string> = {
  right: 'top-0 right-0 h-full w-full max-w-md border-l',
  left: 'top-0 left-0 h-full w-full max-w-md border-r',
  bottom: 'bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl border-t',
}

const PANEL_VARIANTS: Record<DrawerPosition, Variants> = {
  right: {
    hidden: { x: '100%' },
    visible: { x: 0 },
  },
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  },
  bottom: {
    hidden: { y: '100%' },
    visible: { y: 0 },
  },
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Drawer({
  open,
  onClose,
  children,
  position = 'right',
  title,
  closeOnOverlay = true,
  showClose = true,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations()
  const locale = useLocale()

  // En RTL, on reflète les tiroirs latéraux : « right » devient le côté gauche
  // physique et inversement, pour respecter le sens de lecture arabe.
  const effectivePosition: DrawerPosition =
    locale === 'ar' && position === 'right'
      ? 'left'
      : locale === 'ar' && position === 'left'
        ? 'right'
        : position

  useEffect(() => setMounted(true), [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (nodes.length === 0) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return

    previousFocus.current = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    const raf = requestAnimationFrame(() => {
      const target =
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current
      target?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      previousFocus.current?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-hidden="true"
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            variants={PANEL_VARIANTS[effectivePosition]}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute flex flex-col outline-none',
              'bg-[var(--creme)] text-[var(--texte)] border-[var(--bordure)]',
              'shadow-[0_24px_60px_-20px_rgba(20,19,15,0.45)]',
              PANEL_LAYOUT[effectivePosition],
              className,
            )}
          >
            {(title || showClose) && (
              <header className="flex items-center justify-between gap-4 border-b border-[var(--bordure)] px-6 py-5">
                {title ? (
                  <h2
                    id={titleId}
                    className="font-titre text-xl text-[var(--vert-fonce)]"
                  >
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('Common.close')}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center',
                      'text-[var(--texte-doux)] hover:text-[var(--vert-fonce)]',
                      'transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
                    )}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </header>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Drawer
