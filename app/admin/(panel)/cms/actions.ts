'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth/admin-guard'
import { hasPermission } from '@/lib/auth/permissions'
import { upsertHomepageSettings, type HomepageSettingsData } from '@/lib/homepage'

export interface ActionResult {
  ok: boolean
  error?: string
  message?: string
}

async function guardCms(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAdminSession()
  if (!session) return { ok: false, error: 'Session expirée, reconnectez-vous.' }
  if (!hasPermission(session.role, 'cms.update')) return { ok: false, error: 'Permission refusée.' }
  return { ok: true }
}

const SLUG_RE = /^[a-z0-9-]+$/

// ─── Pages CMS ───────────────────────────────────────────────────────────────

export interface CmsPageInput {
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
}

/** Nettoie une liste d'URLs (chaînes non vides uniquement). */
function cleanUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  return urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
}

/** Crée une nouvelle page CMS (slug unique requis). */
export async function createCmsPageAction(input: CmsPageInput): Promise<ActionResult> {
  const g = await guardCms()
  if (!g.ok) return g

  const slug = input.slug.trim().toLowerCase()
  if (!SLUG_RE.test(slug)) return { ok: false, error: 'Slug invalide (lettres minuscules, chiffres et tirets).' }
  if (!input.titleFr.trim()) return { ok: false, error: 'Le titre FR est requis.' }

  try {
    await prisma.cMSPage.create({
      data: {
        slug,
        titleFr: input.titleFr,
        titleAr: input.titleAr || input.titleFr,
        titleEn: input.titleEn || input.titleFr,
        contentFr: input.contentFr,
        contentAr: input.contentAr,
        contentEn: input.contentEn,
        heroImageUrl: input.heroImageUrl?.trim() || null,
        galleryImages: cleanUrls(input.galleryImages),
        isPublished: input.isPublished,
      },
    })
    revalidatePath('/admin/cms')
    return { ok: true, message: 'Page créée' }
  } catch (e) {
    const msg = e instanceof Error && e.message.includes('Unique') ? 'Ce slug existe déjà' : 'Erreur lors de la création'
    return { ok: false, error: msg }
  }
}

/** Met à jour une page CMS existante (identifiée par son slug). */
export async function updateCmsPageAction(input: CmsPageInput): Promise<ActionResult> {
  const g = await guardCms()
  if (!g.ok) return g

  if (!input.titleFr.trim()) return { ok: false, error: 'Le titre FR est requis.' }

  try {
    await prisma.cMSPage.update({
      where: { slug: input.slug },
      data: {
        titleFr: input.titleFr,
        titleAr: input.titleAr || input.titleFr,
        titleEn: input.titleEn || input.titleFr,
        contentFr: input.contentFr,
        contentAr: input.contentAr,
        contentEn: input.contentEn,
        heroImageUrl: input.heroImageUrl?.trim() || null,
        galleryImages: cleanUrls(input.galleryImages),
        isPublished: input.isPublished,
      },
    })
    revalidatePath('/admin/cms')
    revalidatePath(`/admin/cms/${input.slug}`)
    // Rafraîchit les pages publiques susceptibles d'utiliser ce contenu.
    revalidatePath('/[locale]/notre-histoire', 'page')
    revalidatePath('/[locale]/contact', 'page')
    revalidatePath('/[locale]/[slug]', 'page')
    return { ok: true, message: 'Page enregistrée' }
  } catch {
    return { ok: false, error: 'Erreur lors de l’enregistrement' }
  }
}

// ─── Page d'accueil ──────────────────────────────────────────────────────────

export async function updateHomepageAction(
  input: Partial<HomepageSettingsData>,
): Promise<ActionResult> {
  const g = await guardCms()
  if (!g.ok) return g

  try {
    await upsertHomepageSettings(input)
    revalidatePath('/admin/cms/homepage')
    revalidatePath('/[locale]', 'page')
    return { ok: true, message: 'Page d’accueil enregistrée' }
  } catch {
    return { ok: false, error: 'Erreur lors de l’enregistrement' }
  }
}
