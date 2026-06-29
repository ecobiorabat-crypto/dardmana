'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useCurrentLocale } from '@/components/layout/nav'
import { cn } from '@/lib/utils/cn'
import { optimizeCloudinaryUrl } from '@/lib/cloudinary-url'
import type { HeroSlide } from '@/lib/homepage'

const AUTOPLAY_MS = 5000

/**
 * Slider Hero cinématique (style marocain de luxe) : 3 slides max, fond image
 * plein écran, titre arabe + français superposés. Le bouton « Découvrir » fait
 * partie du visuel de l'image — pas de CTA séparé.
 * Auto-play 5 s (pause au survol), fondu doux (Framer Motion), points + flèches.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const locale = useCurrentLocale()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count])

  useEffect(() => {
    if (paused || count <= 1) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(t)
  }, [index, paused, count])

  if (count === 0) return null
  const slide = slides[Math.min(index, count - 1)]
  const isAr = locale === 'ar'
  const image = (isAr ? slide.imageAr || slide.imageFr : slide.imageFr || slide.imageAr) || ''
  const subtitle = isAr ? slide.subtitleAr || slide.subtitleFr : slide.subtitleFr || slide.subtitleAr

  return (
    <section className="bg-[var(--sable)]">
      {/* ─── Slider (images, titres, navigation) ─── */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative min-h-[88vh] overflow-hidden"
      >
      {/* Fond (fondu doux) */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`bg-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {image ? (
            <Image
              src={optimizeCloudinaryUrl(image, { width: 1920 })}
              alt={slide.titleFr || slide.titleAr || 'Dar Dmana'}
              fill
              sizes="100vw"
              quality={85}
              placeholder="empty"
              // Cloudinary optimise déjà (f_auto/q_auto/w_1920) : on évite le double
              // ré-encodage par l'optimiseur Next et on garde l'URL brute, qui
              // correspond exactement au <link rel=preload> du layout (LCP réel).
              unoptimized
              // Premier slide : priorité (LCP). Slides suivants : chargement paresseux.
              {...(index === 0 ? { priority: true } : { loading: 'lazy' as const })}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--sable)] via-[var(--sable-fonce)] to-[var(--sable)]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlay dégradé stable EN BAS (lisibilité titre + bouton sur toute image,
          le haut/centre de l'image reste visible à 100%). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)' }}
      />

      {/* Contenu : titre AR + FR + sous-titre, ancrés en bas (le bouton est
          désormais positionné séparément tout en bas, voir plus loin). */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-end px-4 pb-24 pt-28 text-center sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.titleAr && (
              <h1
                lang="ar"
                dir="rtl"
                className="text-[2.75rem] leading-[1.15] text-[var(--creme)] [text-shadow:0_2px_18px_rgba(20,19,15,0.45)] sm:text-6xl lg:text-7xl"
              >
                {slide.titleAr}
              </h1>
            )}
            {slide.titleFr && (
              <p className="mt-3 font-titre text-2xl tracking-wide text-[var(--or-clair)] [text-shadow:0_1px_10px_rgba(20,19,15,0.4)] sm:text-4xl">
                {slide.titleFr}
              </p>
            )}
            {subtitle && (
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[var(--creme)]/85 sm:text-base">
                {subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flèches */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Slide précédent"
            className="absolute start-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--creme)]/30 bg-[var(--noir)]/20 text-[var(--creme)] backdrop-blur transition-colors hover:bg-[var(--noir)]/40 sm:inline-flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Slide suivant"
            className="absolute end-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--creme)]/30 bg-[var(--noir)]/20 text-[var(--creme)] backdrop-blur transition-colors hover:bg-[var(--noir)]/40 sm:inline-flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Points */}
      {count > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Aller au slide ${i + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                i === index ? 'w-7 bg-[var(--or-clair)]' : 'w-2.5 bg-[var(--creme)]/50 hover:bg-[var(--creme)]/80',
              )}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  )
}

export default HeroSlider
