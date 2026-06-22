'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { formatMad } from '@/lib/utils/price'
import { productName, type ProductCardData } from '@/lib/utils/product'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"

export function HeroSection() {
  const locale = useCurrentLocale()
  const t = useTranslations()
  const titleWords = t('Hero.title').split(' ')
  const [featured, setFeatured] = useState<ProductCardData | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/products?isFeatured=true&limit=1', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setFeatured(d.products?.[0] ?? null))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[var(--vert-fonce)] text-[var(--creme)]">
      {/* Texture grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '120px 120px' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 80% 20%, rgba(201,168,76,0.18) 0%, rgba(26,92,42,0) 55%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-28 pb-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pt-24">
        {/* Texte */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-[var(--or-clair)]"
          >
            {t('Hero.eyebrow')}
          </motion.p>

          <h1 className="font-titre text-[3rem] leading-[0.95] sm:text-[4.5rem] lg:text-[5rem]">
            {titleWords.map((word, i) => (
              <span key={`${word}-${i}`} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i === titleWords.length - 1 ? (
                    <span className="text-[var(--or-royal)]">{word}</span>
                  ) : (
                    word
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 max-w-md text-base leading-relaxed text-[var(--creme)]/80"
          >
            {t('Hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button href={localizedHref(locale, '/catalogue')} variant="gold" size="lg">
              {t('Hero.ctaPrimary')}
            </Button>
            <Button
              href={localizedHref(locale, '/notre-histoire')}
              variant="outline-light"
              size="lg"
            >
              {t('Hero.ctaSecondary')}
            </Button>
          </motion.div>
        </div>

        {/* Produit vedette */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-sm"
          >
            {featured ? (
              <Link href={localizedHref(locale, `/produit/${featured.slug}`)} className="group block">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--vert-moyen)]/30">
                  {featured.images?.[0] ? (
                    <Image
                      src={featured.images[0]}
                      alt={productName(featured, locale)}
                      fill
                      sizes="(max-width: 1024px) 384px, 40vw"
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-titre text-5xl text-[var(--or-clair)]/40">DD</span>
                    </div>
                  )}
                  <span className="absolute start-4 top-4 bg-[var(--or-royal)] px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-[var(--noir)]">
                    {t('Hero.featured')}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="font-titre text-xl text-[var(--creme)]">
                    {productName(featured, locale)}
                  </p>
                  <p className="text-[var(--or-clair)]">{formatMad(Number(featured.priceMad))}</p>
                </div>
              </Link>
            ) : (
              <div className="aspect-[3/4] w-full animate-pulse bg-[var(--vert-moyen)]/30" />
            )}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border border-[var(--creme)]/40 p-1.5">
          <motion.span
            className="h-2 w-1 rounded-full bg-[var(--or-clair)]"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection
