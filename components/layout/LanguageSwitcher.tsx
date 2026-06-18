'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import { setCookie } from '@/lib/utils/cookies'
import { useCurrentLocale } from './nav'
import { cn } from '@/lib/utils/cn'

interface LocaleOption {
  code: string
  label: string
  short: string
}

const OPTIONS: LocaleOption[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'ar', label: 'العربية', short: 'عربي' },
  { code: 'en', label: 'English', short: 'EN' },
]

const LOCALES = routing.locales as readonly string[]

export interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const current = useCurrentLocale()
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const changeLocale = (code: string) => {
    setOpen(false)
    if (code === current) return

    setCookie('NEXT_LOCALE', code, 60 * 60 * 24 * 365)

    const segments = pathname.split('/')
    if (LOCALES.includes(segments[1])) {
      segments[1] = code
    } else {
      segments.splice(1, 0, code)
    }
    const next = segments.join('/') || `/${code}`
    router.replace(next)
    router.refresh()
  }

  const active = OPTIONS.find((o) => o.code === current) ?? OPTIONS[0]

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('Common.changeLanguage')}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em]',
          'text-current transition-opacity duration-200 hover:opacity-70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--or-royal)] focus-visible:ring-offset-2',
        )}
      >
        <span>{active.short}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t('Common.changeLanguage')}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'absolute end-0 top-[calc(100%+0.6rem)] z-50 min-w-[10rem]',
              'border border-[var(--bordure)] bg-[var(--creme)] py-1',
              'shadow-[0_18px_40px_-16px_rgba(20,19,15,0.4)]',
            )}
          >
            {OPTIONS.map((option) => (
              <li key={option.code} role="option" aria-selected={option.code === current}>
                <button
                  type="button"
                  onClick={() => changeLocale(option.code)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-start text-sm',
                    'transition-colors duration-150 hover:bg-[var(--gris-perle)]',
                    option.code === current
                      ? 'text-[var(--vert-fonce)] font-medium'
                      : 'text-[var(--texte)]',
                  )}
                >
                  <span>{option.label}</span>
                  {option.code === current && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--or-royal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher
