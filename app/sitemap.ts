import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { routing } from '@/i18n/routing'

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://dardmana.ma').replace(/\/$/, '')
const LOCALES = routing.locales

type ChangeFreq = MetadataRoute.Sitemap[number]['changeFrequency']

/** Construit l'objet hreflang (alternates.languages) pour un chemin relatif. */
function languagesFor(path: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const locale of LOCALES) map[locale] = `${SITE_URL}/${locale}${path}`
  return map
}

/** Génère une entrée par locale pour un chemin donné, avec hreflang. */
function entriesFor(
  path: string,
  opts: { lastModified?: Date; changeFrequency: ChangeFreq; priority: number },
): MetadataRoute.Sitemap {
  const languages = languagesFor(path)
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = []
  let categories: { slug: string; updatedAt: Date }[] = []

  try {
    ;[products, categories] = await Promise.all([
      prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ])
  } catch {
    products = []
    categories = []
  }

  const staticEntries: MetadataRoute.Sitemap = [
    // Page d'accueil — priorité maximale.
    ...entriesFor('', { changeFrequency: 'daily', priority: 1 }),
    // Pages principales — priorité 0.7.
    ...entriesFor('/catalogue', { changeFrequency: 'daily', priority: 0.7 }),
    ...entriesFor('/nouveautes', { changeFrequency: 'daily', priority: 0.7 }),
    ...entriesFor('/collections', { changeFrequency: 'weekly', priority: 0.7 }),
    ...entriesFor('/notre-histoire', { changeFrequency: 'monthly', priority: 0.7 }),
    ...entriesFor('/contact', { changeFrequency: 'monthly', priority: 0.7 }),
    ...entriesFor('/livre-dor', { changeFrequency: 'weekly', priority: 0.7 }),
  ]

  // Catégories — priorité 0.8.
  const categoryEntries = categories.flatMap((c) =>
    entriesFor(`/catalogue/${c.slug}`, { lastModified: c.updatedAt, changeFrequency: 'weekly', priority: 0.8 }),
  )

  // Produits actifs × locales — priorité 0.9, hebdomadaire.
  const productEntries = products.flatMap((p) =>
    entriesFor(`/produit/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.9 }),
  )

  return [...staticEntries, ...categoryEntries, ...productEntries]
}
