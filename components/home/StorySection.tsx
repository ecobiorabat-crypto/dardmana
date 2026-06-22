'use client'

import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/ui/Reveal'
import { Button } from '@/components/ui/Button'
import { localizedHref, useCurrentLocale } from '@/components/layout/nav'

export interface StoryContent {
  eyebrow?: string
  title?: string
  body?: string
  cta?: string
  stat1Value?: string
  stat1Label?: string
  stat2Value?: string
  stat2Label?: string
  stat3Value?: string
  stat3Label?: string
}

export function StorySection({ content }: { content?: StoryContent } = {}) {
  const locale = useCurrentLocale()
  const t = useTranslations('Story')
  const c = content ?? {}
  // Override CMS si renseigné, sinon repli sur les traductions intégrées.
  const eyebrow = c.eyebrow?.trim() || t('eyebrow')
  const title = c.title?.trim() || t('title')
  const body = c.body?.trim() || t('body')
  const cta = c.cta?.trim() || t('cta')
  const stats = [
    { value: c.stat1Value?.trim() || t('stat1'), label: c.stat1Label?.trim() || t('stat1Label') },
    { value: c.stat2Value?.trim() || t('stat2'), label: c.stat2Label?.trim() || t('stat2Label') },
    { value: c.stat3Value?.trim() || t('stat3'), label: c.stat3Label?.trim() || t('stat3Label') },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal direction="right">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
              {eyebrow}
            </p>
            <h2 className="font-titre text-3xl leading-tight text-[var(--vert-fonce)] sm:text-4xl">
              {title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[var(--texte-doux)]">
              {body}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-y border-[var(--bordure)] py-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-titre text-3xl text-[var(--or-royal)]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--texte-doux)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button href={localizedHref(locale, '/notre-histoire')} variant="outline" size="md">
                {cta}
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal direction="left">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-br from-[var(--vert-fonce)] via-[var(--vert-moyen)] to-[var(--vert-fonce)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-titre text-7xl text-[var(--or-clair)]/30">
                Dar Dmana
              </span>
            </div>
            <div className="absolute -bottom-6 -start-6 hidden h-32 w-32 border border-[var(--or-royal)] sm:block" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default StorySection
