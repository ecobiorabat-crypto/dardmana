import { routing, type Locale } from '@/i18n/routing'

const LOCALES = routing.locales as readonly string[]

/** Construit un href préfixé par la locale — utilisable côté serveur ET client. */
export function localizedHref(locale: string, href: string): string {
  const clean = href.startsWith('/') ? href : `/${href}`
  return `/${locale}${clean === '/' ? '' : clean}`
}

/** Extrait la locale courante depuis un pathname. */
export function localeFromPathname(pathname: string): Locale {
  const segment = (pathname || '/').split('/')[1]
  return LOCALES.includes(segment) ? (segment as Locale) : routing.defaultLocale
}
