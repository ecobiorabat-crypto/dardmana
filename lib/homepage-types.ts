// Types et constantes « pures » de la page d'accueil — SANS dépendance Prisma,
// pour pouvoir être importés depuis des composants client (admin) sans
// embarquer `pg` dans le bundle navigateur.

/** Un slide du Hero cinématique (tous champs optionnels, tolérant aux vides). */
export interface HeroSlide {
  imageFr: string
  imageAr: string
  titleFr: string
  titleAr: string
  subtitleFr: string
  subtitleAr: string
  buttonTextFr: string
  buttonTextAr: string
  buttonLink: string
}

/** Images des 4 tuiles catégories de la grille luxe. */
export interface CategoryGridImages {
  sabhah: string
  bracelets: string
  huiles: string
  pierres: string
}

export const EMPTY_HERO_SLIDE: HeroSlide = {
  imageFr: '', imageAr: '', titleFr: '', titleAr: '', subtitleFr: '', subtitleAr: '',
  buttonTextFr: '', buttonTextAr: '', buttonLink: '',
}

export const EMPTY_CATEGORY_GRID: CategoryGridImages = {
  sabhah: '', bracelets: '', huiles: '', pierres: '',
}
