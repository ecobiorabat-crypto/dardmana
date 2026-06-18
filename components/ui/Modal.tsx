'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/cn'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  description?: ReactNode
  size?: ModalSize
  /** Ferme au clic sur l'overlay (défaut : true). */
  closeOnOverlay?: boolean
  /** Affiche le bouton de fermeture (défaut : true). */
  showClose?: boolean
  className?: string
}

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = 'md',
  closeOnOverlay = true,
  showClose = true,
  className,
}: ModalProps) {
  const t = useTranslations()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descId = useId()
  const [mounted, setMounted] = useState(false)

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
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative z-10 w-full outline-none',
              'bg-[var(--creme)] text-[var(--texte)]',
              'border border-[var(--bordure)] shadow-[0_24px_60px_-20px_rgba(20,19,15,0.45)]',
              'max-h-[90vh] overflow-y-auto',
              SIZES[size],
              className,
            )}
          >
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Common.close')}
                className={cn(
                  'absolute end-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center',
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

            <div className="p-6 sm:p-8">
              {title && (
                <h2
                  id={titleId}
                  className="font-titre text-2xl sm:text-3xl text-[var(--vert-fonce)] pe-8"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-2 text-sm text-[var(--texte-doux)]">
                  {description}
                </p>
              )}
              <div className={cn(title || description ? 'mt-6' : '')}>{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Modal
