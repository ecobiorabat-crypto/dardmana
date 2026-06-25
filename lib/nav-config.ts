import { redirect } from 'next/navigation'
import { getSiteSettings } from '@/lib/settings'
import type { NavConfigKey } from '@/lib/nav-config-types'

/**
 * Redirige vers l'accueil (avec une notice discrète, pas une vraie 404) si la
 * page correspondante est désactivée dans la config de navigation admin.
 * À appeler en tête des pages pilotables.
 */
export async function ensurePageEnabled(key: NavConfigKey, locale: string): Promise<void> {
  const { navConfig } = await getSiteSettings()
  if (navConfig[key] === false) {
    redirect(`/${locale}?unavailable=1`)
  }
}
