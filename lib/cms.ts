import { prisma } from '@/lib/prisma'

export type Locale = 'fr' | 'ar' | 'en'

/** Met la première lettre en capitale (fr → Fr) pour suffixer les champs i18n. */
function cap(locale: string): 'Fr' | 'Ar' | 'En' {
  if (locale === 'ar') return 'Ar'
  if (locale === 'en') return 'En'
  return 'Fr'
}

/**
 * Choisit la valeur localisée d'un objet à champs suffixés (titleFr/titleAr/…).
 * Repli sur le français si la langue demandée est vide.
 */
export function pickLocale<T>(obj: T, base: string, locale: string): string {
  const rec = obj as Record<string, unknown>
  const value = rec[`${base}${cap(locale)}`]
  const fallback = rec[`${base}Fr`]
  return (typeof value === 'string' && value.trim() ? value : (fallback as string)) ?? ''
}

export interface CmsPageData {
  slug: string
  titleFr: string
  titleAr: string
  titleEn: string
  contentFr: string
  contentAr: string
  contentEn: string
  heroImageUrl: string | null
  galleryImages: string[]
  isPublished: boolean
  updatedAt: Date
}

/** Lit une page CMS publiée par slug. Renvoie null si absente/brouillon/erreur. */
export async function getPublishedCmsPage(slug: string): Promise<CmsPageData | null> {
  try {
    const page = await prisma.cMSPage.findUnique({ where: { slug } })
    if (!page || !page.isPublished) return null
    return page
  } catch {
    return null
  }
}
