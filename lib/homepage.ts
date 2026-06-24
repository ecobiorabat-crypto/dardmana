import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  DEFAULT_CATEGORY_GRID,
  EMPTY_CATEGORY_GRID,
  type CategoryGridImages,
  type CategoryGridTile,
  type HeroSlide,
} from '@/lib/homepage-types'

// Ré-exports pour conserver les imports existants `from '@/lib/homepage'`.
export { EMPTY_HERO_SLIDE, EMPTY_CATEGORY_GRID, DEFAULT_CATEGORY_GRID } from '@/lib/homepage-types'
export type { HeroSlide, CategoryGridImages, CategoryGridTile } from '@/lib/homepage-types'

const SINGLETON_ID = 'singleton'

export interface HomepageSettingsData {
  heroTitleFr: string | null
  heroTitleAr: string | null
  heroTitleEn: string | null
  heroSubtitleFr: string | null
  heroSubtitleAr: string | null
  heroSubtitleEn: string | null
  announcementTextFr: string | null
  announcementTextAr: string | null
  announcementTextEn: string | null
  announcementActive: boolean
  featuredProductIds: string[]
  newsletterTitleFr: string | null
  newsletterTitleAr: string | null
  newsletterTitleEn: string | null
  // Section « Notre savoir-faire » (storytelling).
  storytellingEyebrowFr: string | null
  storytellingEyebrowAr: string | null
  storytellingEyebrowEn: string | null
  storytellingTitleFr: string | null
  storytellingTitleAr: string | null
  storytellingTitleEn: string | null
  storytellingTextFr: string | null
  storytellingTextAr: string | null
  storytellingTextEn: string | null
  stat1Value: string | null
  stat1LabelFr: string | null
  stat1LabelAr: string | null
  stat1LabelEn: string | null
  stat2Value: string | null
  stat2LabelFr: string | null
  stat2LabelAr: string | null
  stat2LabelEn: string | null
  stat3Value: string | null
  stat3LabelFr: string | null
  stat3LabelAr: string | null
  stat3LabelEn: string | null
  storytellingButtonTextFr: string | null
  storytellingButtonTextAr: string | null
  storytellingButtonTextEn: string | null
  storytellingImageUrl: string | null
  heroSlides: HeroSlide[]
  categoryGridImages: CategoryGridImages
  categoryGrid: CategoryGridTile[]
  featuredSliderEnabled: boolean
  featuredProductsCount: number
  featuredSliderCount: number
}

const STORYTELLING_KEYS = [
  'storytellingEyebrowFr', 'storytellingEyebrowAr', 'storytellingEyebrowEn',
  'storytellingTitleFr', 'storytellingTitleAr', 'storytellingTitleEn',
  'storytellingTextFr', 'storytellingTextAr', 'storytellingTextEn',
  'stat1Value', 'stat1LabelFr', 'stat1LabelAr', 'stat1LabelEn',
  'stat2Value', 'stat2LabelFr', 'stat2LabelAr', 'stat2LabelEn',
  'stat3Value', 'stat3LabelFr', 'stat3LabelAr', 'stat3LabelEn',
  'storytellingButtonTextFr', 'storytellingButtonTextAr', 'storytellingButtonTextEn',
] as const

export const HOMEPAGE_DEFAULTS: HomepageSettingsData = {
  heroTitleFr: null,
  heroTitleAr: null,
  heroTitleEn: null,
  heroSubtitleFr: null,
  heroSubtitleAr: null,
  heroSubtitleEn: null,
  announcementTextFr: null,
  announcementTextAr: null,
  announcementTextEn: null,
  announcementActive: false,
  featuredProductIds: [],
  newsletterTitleFr: null,
  newsletterTitleAr: null,
  newsletterTitleEn: null,
  storytellingEyebrowFr: null,
  storytellingEyebrowAr: null,
  storytellingEyebrowEn: null,
  storytellingTitleFr: null,
  storytellingTitleAr: null,
  storytellingTitleEn: null,
  storytellingTextFr: null,
  storytellingTextAr: null,
  storytellingTextEn: null,
  stat1Value: null,
  stat1LabelFr: null,
  stat1LabelAr: null,
  stat1LabelEn: null,
  stat2Value: null,
  stat2LabelFr: null,
  stat2LabelAr: null,
  stat2LabelEn: null,
  stat3Value: null,
  stat3LabelFr: null,
  stat3LabelAr: null,
  stat3LabelEn: null,
  storytellingButtonTextFr: null,
  storytellingButtonTextAr: null,
  storytellingButtonTextEn: null,
  storytellingImageUrl: null,
  heroSlides: [],
  categoryGridImages: EMPTY_CATEGORY_GRID,
  categoryGrid: DEFAULT_CATEGORY_GRID,
  featuredSliderEnabled: false,
  featuredProductsCount: 4,
  featuredSliderCount: 5,
}

/** Normalise une valeur JSON brute en tableau de HeroSlide. */
function parseHeroSlides(raw: Prisma.JsonValue | null | undefined): HeroSlide[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 3).map((s) => {
    const o = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>
    const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '')
    return {
      imageFr: str('imageFr'), imageAr: str('imageAr'),
      titleFr: str('titleFr'), titleAr: str('titleAr'),
      subtitleFr: str('subtitleFr'), subtitleAr: str('subtitleAr'),
      buttonTextFr: str('buttonTextFr'), buttonTextAr: str('buttonTextAr'),
      buttonLink: str('buttonLink'),
    }
  })
}

/** Normalise une valeur JSON brute en CategoryGridImages (legacy). */
function parseCategoryGrid(raw: Prisma.JsonValue | null | undefined): CategoryGridImages {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY_CATEGORY_GRID }
  const o = raw as Record<string, unknown>
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '')
  return { sabhah: str('sabhah'), bracelets: str('bracelets'), huiles: str('huiles'), pierres: str('pierres') }
}

/**
 * Construit les 4 tuiles catégories : part des défauts, applique les overrides
 * `categoryGrid` (JSON), et récupère les images legacy `categoryGridImages`
 * si une tuile n'a pas encore d'image (pas de régression).
 */
function buildCategoryGrid(
  raw: Prisma.JsonValue | null | undefined,
  legacy: CategoryGridImages,
): CategoryGridTile[] {
  const arr = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
  const byKey = new Map<string, Record<string, unknown>>()
  for (const t of arr) {
    if (t && typeof t === 'object' && typeof t.key === 'string') byKey.set(t.key, t)
  }
  return DEFAULT_CATEGORY_GRID.map((def) => {
    const o = byKey.get(def.key) ?? {}
    const str = (k: keyof CategoryGridTile) =>
      typeof o[k] === 'string' && (o[k] as string).length > 0 ? (o[k] as string) : def[k]
    const legacyImg = (legacy as unknown as Record<string, string>)[def.key] || ''
    const imageFr = typeof o.imageFr === 'string' && o.imageFr ? o.imageFr : legacyImg
    return {
      key: def.key,
      imageFr,
      imageAr: typeof o.imageAr === 'string' && o.imageAr ? (o.imageAr as string) : imageFr,
      titleFr: str('titleFr'),
      titleAr: str('titleAr'),
      titleEn: str('titleEn'),
      descriptionFr: typeof o.descriptionFr === 'string' ? (o.descriptionFr as string) : '',
      descriptionAr: typeof o.descriptionAr === 'string' ? (o.descriptionAr as string) : '',
      descriptionEn: typeof o.descriptionEn === 'string' ? (o.descriptionEn as string) : '',
      link: typeof o.link === 'string' && o.link ? (o.link as string) : def.link,
    }
  })
}

/**
 * Lit le contenu éditable de la page d'accueil (singleton). Renvoie les valeurs
 * par défaut si aucune ligne n'existe ou si la base est indisponible.
 */
export async function getHomepageSettings(): Promise<HomepageSettingsData> {
  try {
    const row = await prisma.homepageSettings.findUnique({ where: { id: SINGLETON_ID } })
    if (!row) return HOMEPAGE_DEFAULTS
    const storytelling = Object.fromEntries(
      STORYTELLING_KEYS.map((k) => [k, (row as Record<string, unknown>)[k] ?? null]),
    ) as Pick<HomepageSettingsData, (typeof STORYTELLING_KEYS)[number]>
    return {
      heroTitleFr: row.heroTitleFr,
      heroTitleAr: row.heroTitleAr,
      heroTitleEn: row.heroTitleEn,
      heroSubtitleFr: row.heroSubtitleFr,
      heroSubtitleAr: row.heroSubtitleAr,
      heroSubtitleEn: row.heroSubtitleEn,
      announcementTextFr: row.announcementTextFr,
      announcementTextAr: row.announcementTextAr,
      announcementTextEn: row.announcementTextEn,
      announcementActive: row.announcementActive,
      featuredProductIds: row.featuredProductIds,
      newsletterTitleFr: row.newsletterTitleFr,
      newsletterTitleAr: row.newsletterTitleAr,
      newsletterTitleEn: row.newsletterTitleEn,
      storytellingImageUrl: row.storytellingImageUrl,
      heroSlides: parseHeroSlides(row.heroSlides),
      categoryGridImages: parseCategoryGrid(row.categoryGridImages),
      categoryGrid: buildCategoryGrid(row.categoryGrid, parseCategoryGrid(row.categoryGridImages)),
      featuredSliderEnabled: row.featuredSliderEnabled,
      featuredProductsCount: row.featuredProductsCount,
      featuredSliderCount: row.featuredSliderCount,
      ...storytelling,
    }
  } catch {
    return HOMEPAGE_DEFAULTS
  }
}

/** Crée ou met à jour le singleton de la page d'accueil. */
export async function upsertHomepageSettings(data: Partial<HomepageSettingsData>) {
  // Les champs JSON (heroSlides, categoryGridImages) sont sûrs (chaînes pures),
  // mais leurs types applicatifs ne correspondent pas à InputJsonValue → cast.
  const create = { id: SINGLETON_ID, ...HOMEPAGE_DEFAULTS, ...data } as unknown as Prisma.HomepageSettingsUncheckedCreateInput
  const update = data as unknown as Prisma.HomepageSettingsUncheckedUpdateInput
  return prisma.homepageSettings.upsert({ where: { id: SINGLETON_ID }, create, update })
}
