import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils/cn'

interface TrustItem {
  emoji: string
  /** Clés dans la section `Trust`. */
  titleKey: string
  subtitleKey: string
}

const ITEMS: TrustItem[] = [
  { emoji: '🚚', titleKey: 'delivery', subtitleKey: 'deliveryDesc' },
  { emoji: '🔒', titleKey: 'payment', subtitleKey: 'paymentDesc' },
  { emoji: '✅', titleKey: 'authentic', subtitleKey: 'authenticDesc' },
  { emoji: '🤝', titleKey: 'local', subtitleKey: 'localDesc' },
]

/**
 * Bande de réassurance : 4 colonnes (2×2 mobile) avec séparateurs verticaux.
 * Fond crème (#faf6ef), bordures sable foncé (#e8d5b7), icônes emoji.
 */
export async function TrustStrip() {
  const t = await getTranslations('Trust')
  return (
    <section className="border-y border-[var(--sable-fonce)] bg-[var(--creme)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div
            key={item.titleKey}
            className={cn(
              'flex items-center gap-3 px-5 py-5',
              // Séparateurs verticaux : entre les 2 colonnes (mobile) et entre
              // les 4 colonnes (desktop), jamais sur la dernière de la rangée.
              'border-[var(--sable-fonce)]',
              'odd:border-e lg:border-e lg:[&:nth-child(4)]:border-e-0',
            )}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {item.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--vert-fonce)]">{t(item.titleKey)}</p>
              <p className="text-xs leading-snug text-[var(--texte-doux)]">{t(item.subtitleKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustStrip
