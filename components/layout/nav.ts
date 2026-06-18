'use client'

import { usePathname } from 'next/navigation'
import { type Locale } from '@/i18n/routing'
import { localeFromPathname } from '@/lib/utils/locale'

export interface NavLink {
  /** Clé de traduction dans la section `Nav` des catalogues de messages. */
  key: 'collections' | 'new' | 'story' | 'guestbook' | 'contact'
  href: string
}

/** Liens de navigation principaux (href relatifs, sans préfixe de locale). */
export const NAV_LINKS: NavLink[] = [
  { key: 'collections', href: '/collections' },
  { key: 'new', href: '/nouveautes' },
  { key: 'story', href: '/notre-histoire' },
  { key: 'guestbook', href: '/livre-dor' },
  { key: 'contact', href: '/contact' },
]

/** Construit un href préfixé par la locale — ré-exporté pour compat. */
export { localizedHref } from '@/lib/utils/locale'

/** Locale courante dérivée de l'URL (robuste sans provider next-intl). */
export function useCurrentLocale(): Locale {
  const pathname = usePathname() || '/'
  return localeFromPathname(pathname)
}
