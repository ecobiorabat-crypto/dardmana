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
}

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
}

/**
 * Lit le contenu éditable de la page d'accueil (singleton). Renvoie les valeurs
 * par défaut si aucune ligne n'existe ou si la base est indisponible.
 */
export async function getHomepageSettings(): Promise<HomepageSettingsData> {
  try {
    const row = await prisma.homepageSettings.findUnique({ where: { id: SINGLETON_ID } })
    if (!row) return HOMEPAGE_DEFAULTS
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
