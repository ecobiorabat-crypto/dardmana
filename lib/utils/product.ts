export interface LocalizedFields {
  fr: string
  ar?: string | null
  en?: string | null
}

/** Sélectionne le champ correspondant à la locale, fallback en français. */
export function pickLocale(fields: LocalizedFields, locale: string): string {
  if (locale === 'ar' && fields.ar) return fields.ar
  if (locale === 'en' && fields.en) return fields.en
  return fields.fr
}

export interface ProductCardData {
  id: string
  slug: string
  nameFr: string
  nameAr?: string | null
  nameEn?: string | null
  priceMad: number | string
  comparePriceMad?: number | string | null
  images: string[]
  ratingAvg?: number
  ratingCount?: number
  isNew?: boolean
  isFeatured?: boolean
  stock?: number
}

export function productName(p: ProductCardData, locale: string): string {
  return pickLocale({ fr: p.nameFr, ar: p.nameAr, en: p.nameEn }, locale)
}
