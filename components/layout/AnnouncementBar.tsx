'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { hasCookie, setCookie } from '@/lib/utils/cookies'
import { useHydrated } from './hooks'
import { cn } from '@/lib/utils/cn'

export interface AnnouncementBarProps {
  message?: React.ReactNode
  /** Clé du cookie de fermeture (permet plusieurs campagnes). */
  cookieKey?: string
  className?: string
}

const DISMISS_MAX_AGE = 60 * 60 * 24 // 24h

export function AnnouncementBar({
  message,
  cookieKey = 'dd-announcement',
  className,
}: AnnouncementBarProps) {
  const t = useTranslations()
  const hydrated = useHydrated()
  const [dismissed, setDismissed] = useState(false)
  const visible = hydrated && !dismissed && !hasCookie(cookieKey)
  const text = message ?? t('Announcement.freeShipping')

  const dismiss = () => {
    setCookie(cookieKey, '1', DISMISS_MAX_AGE)
    setDismissed(true)
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('overflow-hidden bg-[var(--or-royal)] text-[var(--noir)]', className)}
        >
          <div className="relative mx-auto flex max-w-7xl items-center justify-center px-10 py-2.5 sm:px-6">
            <p className="text-center text-xs font-medium uppercase tracking-[0.16em]">{text}</p>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t('Common.close')}
              className={cn(
                'absolute end-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center',
                'text-[var(--noir)] transition-opacity hover:opacity-60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vert-fonce)]',
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnnouncementBar
