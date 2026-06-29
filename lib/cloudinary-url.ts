/**
 * Transformation d'URL Cloudinary — module SANS dépendance au SDK Cloudinary
 * (pur traitement de chaîne), donc sûr à importer dans des composants client.
 */

export interface CloudinaryOptimizeOptions {
  /** Largeur max en px (w_…). Défaut 1920. */
  width?: number
  /** Qualité (q_…). Défaut 'auto'. */
  quality?: string | number
  /** Format (f_…). Défaut 'auto' (→ WebP/AVIF selon le navigateur). */
  format?: string | number
}

/**
 * Injecte `f_auto,q_auto,w_<width>` juste après `/upload/` dans une URL Cloudinary
 * (format auto WebP/AVIF + qualité auto + largeur max). Renvoie l'URL inchangée si
 * ce n'est pas une URL de livraison Cloudinary ou si une transformation est déjà
 * présente (idempotent).
 */
export function optimizeCloudinaryUrl(
  url: string,
  options: CloudinaryOptimizeOptions = {},
): string {
  if (!url || typeof url !== 'string') return url

  const marker = '/upload/'
  if (!url.includes('res.cloudinary.com') || !url.includes(marker)) return url

  const { width = 1920, quality = 'auto', format = 'auto' } = options
  const transform = `f_${format},q_${quality},w_${width}`

  const [prefix, rest] = url.split(marker)
  // Ne pas ré-injecter si une transformation existe déjà (segment après /upload/).
  const firstSegment = rest.split('/')[0]
  if (/(^|,)(f_|q_|w_|c_|e_|dpr_)/.test(firstSegment)) return url

  return `${prefix}${marker}${transform}/${rest}`
}
