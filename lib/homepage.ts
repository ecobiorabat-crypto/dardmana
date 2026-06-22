import { prisma } from '@/lib/prisma'

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
      ...storytelling,
    }
  } catch {
    return HOMEPAGE_DEFAULTS
  }
}

/** Crée ou met à jour le singleton de la page d'accueil. */
export async function upsertHomepageSettings(data: Partial<HomepageSettingsData>) {
  return prisma.homepageSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...HOMEPAGE_DEFAULTS, ...data },
    update: data,
  })
}
