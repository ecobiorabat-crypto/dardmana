import { prisma } from '@/lib/prisma'

const SINGLETON_ID = 'singleton'

export interface SiteSettingsData {
  siteName: string
  logoUrl: string | null
  logoUrlDark: string | null
  faviconUrl: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  email: string | null
  socialInstagram: string | null
  socialFacebook: string | null
  socialTikTok: string | null
  whatsappNotificationsEnabled: boolean
  whatsappNotificationNumber: string | null
}

const DEFAULTS: SiteSettingsData = {
  siteName: 'Dar Dmana',
  logoUrl: null,
  logoUrlDark: null,
  faviconUrl: null,
  phone: null,
  whatsapp: null,
  address: null,
  email: null,
  socialInstagram: null,
  socialFacebook: null,
  socialTikTok: null,
  whatsappNotificationsEnabled: false,
  whatsappNotificationNumber: null,
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
      phone: row.phone,
      whatsapp: row.whatsapp,
      address: row.address,
      email: row.email,
      socialInstagram: row.socialInstagram,
      socialFacebook: row.socialFacebook,
      socialTikTok: row.socialTikTok,
      whatsappNotificationsEnabled: row.whatsappNotificationsEnabled,
      whatsappNotificationNumber: row.whatsappNotificationNumber,
    }
  } catch {
    return DEFAULTS
  }
}

/** Crée ou met à jour le singleton de configuration. */
export async function upsertSiteSettings(data: Partial<SiteSettingsData>) {
  // N'écrit que les champs explicitement fournis (les autres gardent leur valeur).
  const fields = [
    'logoUrl', 'logoUrlDark', 'faviconUrl',
    'phone', 'whatsapp', 'address', 'email',
    'socialInstagram', 'socialFacebook', 'socialTikTok',
    'whatsappNotificationNumber',
  ] as const

  const update: Record<string, unknown> = {}
  if (data.siteName !== undefined) update.siteName = data.siteName
  if (data.whatsappNotificationsEnabled !== undefined) {
    update.whatsappNotificationsEnabled = data.whatsappNotificationsEnabled
  }
  for (const f of fields) {
    if (data[f] !== undefined) update[f] = data[f] ?? null
  }

  return prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      siteName: data.siteName ?? DEFAULTS.siteName,
      logoUrl: data.logoUrl ?? null,
      logoUrlDark: data.logoUrlDark ?? null,
      faviconUrl: data.faviconUrl ?? null,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      address: data.address ?? null,
      email: data.email ?? null,
      socialInstagram: data.socialInstagram ?? null,
      socialFacebook: data.socialFacebook ?? null,
      socialTikTok: data.socialTikTok ?? null,
      whatsappNotificationsEnabled: data.whatsappNotificationsEnabled ?? false,
      whatsappNotificationNumber: data.whatsappNotificationNumber ?? null,
    },
    update,
  })
}
