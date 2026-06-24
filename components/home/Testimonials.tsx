'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/ui/Reveal'
import { RatingStars } from '@/components/ui/RatingStars'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

interface Testimonial {
  quoteKey: string
  name: string
  countryKey: string
  rating: number
}

const TESTIMONIALS: Testimonial[] = [
  { quoteKey: 'quote1', name: 'Salma B.', countryKey: 'country1', rating: 5 },
  { quoteKey: 'quote2', name: 'Camille D.', countryKey: 'country2', rating: 5 },
  { quoteKey: 'quote3', name: 'Youssef A.', countryKey: 'country3', rating: 4 },
]

export interface FeaturedTestimonial {
  id: string
  name: string
  message: string
  rating: number
  location: string
}

export function Testimonials({ featured = [] }: { featured?: FeaturedTestimonial[] } = {}) {
  const t = useTranslations('Testimonials')
  const locale = useCurrentLocale()

  // Utilise les témoignages mis en avant si disponibles, sinon repli statique.
  const items =
    featured.length > 0
      ? featured.map((f) => ({ key: f.id, quote: f.message, name: f.name, location: f.location, rating: f.rating }))
      : TESTIMONIALS.map((item) => ({
          key: item.name,
          quote: t(item.quoteKey),
          name: item.name,
          location: t(item.countryKey),
          rating: item.rating,
        }))

  return (
    <section className="bg-[var(--creme)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
              {t('subtitle')}
            </p>
            <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
              {t('title')}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.key} delay={i * 0.08}>
              <figure className="flex h-full flex-col border border-[var(--bordure)] bg-[var(--blanc)] p-7">
                <RatingStars rating={item.rating} size="sm" />
                <blockquote className="mt-4 flex-1 font-titre text-lg italic leading-relaxed text-[var(--texte)]">
                  « {item.quote} »
                </blockquote>
                <figcaption className="mt-6 border-t border-[var(--bordure)] pt-4">
                  <p className="text-sm font-medium text-[var(--vert-fonce)]">{item.name}</p>
                  {item.location && <p className="text-xs text-[var(--texte-doux)]">{item.location}</p>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-8 flex justify-center">
            <Link
              href={localizedHref(locale, '/livre-dor')}
              className="rounded-[2px] border border-[var(--vert-fonce)] px-8 py-3 text-sm font-medium text-[var(--vert-fonce)] transition-colors hover:bg-[var(--vert-fonce)] hover:text-[var(--blanc)]"
            >
              {t('viewAll')}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Testimonials
