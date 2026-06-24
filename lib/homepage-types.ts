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

/** Images des 4 tuiles catégories de la grille luxe (legacy — images seules). */
export interface CategoryGridImages {
  sabhah: string
  bracelets: string
  huiles: string
  pierres: string
}

/** Une tuile catégorie de la grille luxe (contenu éditable complet). */
export interface CategoryGridTile {
  key: string
  imageFr: string
  imageAr: string
  titleFr: string
  titleAr: string
  titleEn: string
  descriptionFr: string
  descriptionAr: string
  descriptionEn: string
  link: string
}

export const EMPTY_HERO_SLIDE: HeroSlide = {
  imageFr: '', imageAr: '', titleFr: '', titleAr: '', subtitleFr: '', subtitleAr: '',
  buttonTextFr: '', buttonTextAr: '', buttonLink: '',
}

export const EMPTY_CATEGORY_GRID: CategoryGridImages = {
  sabhah: '', bracelets: '', huiles: '', pierres: '',
}

/** 4 tuiles par défaut (titres = valeurs hardcodées actuelles ; repli). */
export const DEFAULT_CATEGORY_GRID: CategoryGridTile[] = [
  {
    key: 'sabhah', imageFr: '', imageAr: '',
    titleFr: 'SABHAH', titleAr: 'سبحة', titleEn: 'SABHAH',
    descriptionFr: '', descriptionAr: '', descriptionEn: '', link: '/catalogue',
  },
  {
    key: 'bracelets', imageFr: '', imageAr: '',
    titleFr: 'BRACELETS', titleAr: 'أساور', titleEn: 'BRACELETS',
    descriptionFr: '', descriptionAr: '', descriptionEn: '', link: '/catalogue',
  },
  {
    key: 'huiles', imageFr: '', imageAr: '',
    titleFr: 'HUILES PARFUMÉES', titleAr: 'زيوت عطرية', titleEn: 'PERFUMED OILS',
    descriptionFr: '', descriptionAr: '', descriptionEn: '', link: '/catalogue',
  },
  {
    key: 'pierres', imageFr: '', imageAr: '',
    titleFr: 'PIERRES NATURELLES', titleAr: 'أحجار طبيعية', titleEn: 'NATURAL STONES',
    descriptionFr: '', descriptionAr: '', descriptionEn: '', link: '/catalogue',
  },
]
