import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { Reveal } from '@/components/ui/Reveal'

interface Card {
  titleKey: string
  descKey: string
  icon: ReactNode
}

const CARDS: Card[] = [
  {
    titleKey: 'codTitle',
    descKey: 'codDesc',
    icon: <path d="M3 7h18v10H3zM3 11h18M7 15h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titleKey: 'cmiTitle',
    descKey: 'cmiDesc',
    icon: <path d="M3 6h18v12H3zM3 10h18M6 14h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titleKey: 'stripeTitle',
    descKey: 'stripeDesc',
    icon: <path d="M5 8h14l-1 8H6L5 8zM9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titleKey: 'sslTitle',
    descKey: 'sslDesc',
    icon: <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9.5 12l1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
  },
]

export async function PaymentShipping() {
  const t = await getTranslations('PaymentShipping')
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal>
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--or-royal)]">
            {t('eyebrow')}
          </p>
          <h2 className="font-titre text-3xl text-[var(--vert-fonce)] sm:text-4xl">
            {t('title')}
          </h2>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <Reveal key={card.titleKey} delay={i * 0.05}>
            <div className="flex h-full flex-col items-start gap-4 border border-[var(--bordure)] bg-[var(--blanc)] p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--creme)] text-[var(--vert-fonce)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {card.icon}
                </svg>
              </span>
              <h3 className="font-titre text-lg text-[var(--texte)]">{t(card.titleKey)}</h3>
              <p className="text-sm leading-relaxed text-[var(--texte-doux)]">{t(card.descKey)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default PaymentShipping
