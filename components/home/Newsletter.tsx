'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface NewsletterProps {
  /** Override CMS du titre (sinon repli sur la traduction). */
  titleOverride?: string
}

export function Newsletter({ titleOverride }: NewsletterProps = {}) {
  const t = useTranslations('Newsletter')
  const title = titleOverride?.trim() || t('title')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <section className="bg-[var(--vert-fonce)] text-[var(--creme)]">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-clair)]">
          {t('eyebrow')}
        </p>
        <h2 className="font-titre text-3xl sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--creme)]/75">
          {t('subtitle')}
        </p>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-[var(--or-clair)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm">{t('success')}</span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('placeholder')}
                  aria-label={t('placeholder')}
                  className={cn(
                    'h-12 flex-1 border border-[var(--creme)]/30 bg-transparent px-4 text-sm text-[var(--creme)]',
                    'placeholder:text-[var(--creme)]/50 outline-none transition-colors',
                    'focus:border-[var(--or-royal)]',
                  )}
                />
                <Button type="submit" variant="gold" size="md">
                  {t('subscribe')}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
