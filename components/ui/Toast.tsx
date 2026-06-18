'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useUiStore } from '@/store/ui'
import { cn } from '@/lib/utils/cn'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

const AUTO_DISMISS_MS = 4000

interface ToastStyle {
  accent: string
  icon: ReactNode
}

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  error: (
    <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  ),
  info: (
    <path d="M12 8h.01M11 11h1v6h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  warning: (
    <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  ),
}

const STYLES: Record<ToastType, ToastStyle> = {
  success: { accent: 'text-[var(--succes)]', icon: ICONS.success },
  error: { accent: 'text-[var(--erreur)]', icon: ICONS.error },
  info: { accent: 'text-[var(--info)]', icon: ICONS.info },
  warning: { accent: 'text-[var(--alerte)]', icon: ICONS.warning },
}

/**
 * Toaster global lié au store `useUiStore`.
 * À monter une seule fois (ex. dans le layout racine).
 */
export function Toast() {
  const t = useTranslations()
  const { message, type, show } = useUiStore((s) => s.toast)
  const hideToast = useUiStore((s) => s.hideToast)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!show) return
    const timer = window.setTimeout(hideToast, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [show, message, type, hideToast])

  if (!mounted) return null

  const style = STYLES[type] ?? STYLES.info

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex justify-center px-4 sm:inset-x-auto sm:end-6 sm:justify-end"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {show && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-center gap-3',
              'bg-[var(--blanc)] text-[var(--texte)]',
              'border border-[var(--bordure)] shadow-[0_18px_40px_-16px_rgba(20,19,15,0.4)]',
              'px-4 py-3.5',
            )}
          >
            <span
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                'bg-[var(--gris-perle)]',
                style.accent,
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {style.icon}
              </svg>
            </span>

            <p className="flex-1 text-sm leading-snug">{message}</p>

            <button
              type="button"
              onClick={hideToast}
              aria-label={t('Common.closeNotification')}
              className={cn(
                'inline-flex h-7 w-7 shrink-0 items-center justify-center',
                'text-[var(--texte-doux)] hover:text-[var(--vert-fonce)] transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)]',
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

export default Toast
