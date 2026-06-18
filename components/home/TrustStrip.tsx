import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'

interface TrustItem {
  /** Clés dans la section `Trust`. */
  titleKey: string
  subtitleKey: string
  icon: ReactNode
}

const ITEMS: TrustItem[] = [
  {
    titleKey: 'delivery',
    subtitleKey: 'deliveryDesc',
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    ),
  },
  {
    titleKey: 'payment',
    subtitleKey: 'paymentDesc',
    icon: (
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9.5 12l1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    titleKey: 'authentic',
    subtitleKey: 'authenticDesc',
    icon: (
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8L12 3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    ),
  },
  {
    titleKey: 'local',
    subtitleKey: 'localDesc',
    icon: (
      <path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
]

export async function TrustStrip() {
  const t = await getTranslations('Trust')
  return (
    <section className="border-y border-[var(--bordure)] bg-[var(--creme)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map((item) => (
          <div key={item.titleKey} className="flex items-center gap-3.5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--or-royal)]/40 text-[var(--vert-fonce)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {item.icon}
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--texte)]">{t(item.titleKey)}</p>
              <p className="text-xs text-[var(--texte-doux)]">{t(item.subtitleKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustStrip
