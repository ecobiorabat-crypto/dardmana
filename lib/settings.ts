import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export interface SiteSettingsData {
  siteName: string
  logoUrl: string | null
  logoUrlDark: string | null
  faviconUrl: string | null
}

const DEFAULTS: SiteSettingsData = {
  siteName: 'Dar Dmana',
  logoUrl: null,
  logoUrlDark: null,
  faviconUrl: null,
}

/**
 * Lit la configuration du site (singleton). Renvoie des valeurs par défaut si
 * aucune ligne n'existe ou si la base est indisponible — ne lève jamais.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } })
    if (!row) return DEFAULTS
    return {
      siteName: row.siteName,
      logoUrl: row.logoUrl,
      logoUrlDark: row.logoUrlDark,
      faviconUrl: row.faviconUrl,
    }
  } catch {
    return DEFAULTS
  }
}

/** Crée ou met à jour le singleton de configuration. */
export async function upsertSiteSettings(data: Partial<SiteSettingsData>) {
  return prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      siteName: data.siteName ?? DEFAULTS.siteName,
      logoUrl: data.logoUrl ?? null,
      logoUrlDark: data.logoUrlDark ?? null,
      faviconUrl: data.faviconUrl ?? null,
    },
    update: {
      ...(data.siteName !== undefined && { siteName: data.siteName }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.logoUrlDark !== undefined && { logoUrlDark: data.logoUrlDark }),
      ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl }),
    },
  })
}
