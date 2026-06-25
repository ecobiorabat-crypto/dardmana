// Types « purs » de la config de navigation — SANS dépendance Prisma, pour être
// importés depuis des composants client (Navbar, Footer, mega-menu, admin).

export type NavConfigKey =
  | 'collections'
  | 'nouveautes'
  | 'notreHistoire'
  | 'livreDor'
  | 'contact'
  | 'bestSellers'
  | 'editionsLimitees'
  | 'faq'
  | 'livraisonRetours'
  | 'suivi'

export type NavConfig = Record<NavConfigKey, boolean>

export const NAV_CONFIG_KEYS: NavConfigKey[] = [
  'collections', 'nouveautes', 'notreHistoire', 'livreDor', 'contact',
  'bestSellers', 'editionsLimitees', 'faq', 'livraisonRetours', 'suivi',
]

/** Tout activé par défaut. */
export const DEFAULT_NAV_CONFIG: NavConfig = {
  collections: true, nouveautes: true, notreHistoire: true, livreDor: true, contact: true,
  bestSellers: true, editionsLimitees: true, faq: true, livraisonRetours: true, suivi: true,
}

/** Libellés admin des toggles. */
export const NAV_CONFIG_LABELS: Record<NavConfigKey, string> = {
  collections: 'Collections',
  nouveautes: 'Nouveautés',
  notreHistoire: 'Notre Histoire',
  livreDor: "Livre d'Or",
  contact: 'Contact',
  bestSellers: 'Best Sellers',
  editionsLimitees: 'Éditions Limitées',
  faq: 'FAQ',
  livraisonRetours: 'Livraison & Retours',
  suivi: 'Suivi de commande',
}

/** Associe un href (sans préfixe de locale) à sa clé navConfig (si pilotable). */
export const HREF_TO_NAV_KEY: Record<string, NavConfigKey> = {
  '/collections': 'collections',
  '/nouveautes': 'nouveautes',
  '/notre-histoire': 'notreHistoire',
  '/livre-dor': 'livreDor',
  '/contact': 'contact',
  '/best-sellers': 'bestSellers',
  '/editions-limitees': 'editionsLimitees',
  '/faq': 'faq',
  '/livraison-retours': 'livraisonRetours',
  '/suivi': 'suivi',
}

/** Normalise une valeur JSON brute en NavConfig complet (défaut = activé). */
export function parseNavConfig(raw: unknown): NavConfig {
  const out: NavConfig = { ...DEFAULT_NAV_CONFIG }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    for (const k of NAV_CONFIG_KEYS) {
      if (typeof o[k] === 'boolean') out[k] = o[k] as boolean
    }
  }
  return out
}

/** Un lien est-il actif ? (les href non pilotables = toujours actifs). */
export function isLinkEnabled(navConfig: NavConfig, href: string): boolean {
  const key = HREF_TO_NAV_KEY[href]
  return key ? navConfig[key] !== false : true
}
