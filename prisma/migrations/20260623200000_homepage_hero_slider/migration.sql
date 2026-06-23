-- Slider Hero cinématique + grille catégories + slider produits (page d'accueil).
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "heroSlides" JSONB;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "categoryGridImages" JSONB;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "featuredSliderEnabled" BOOLEAN NOT NULL DEFAULT false;
