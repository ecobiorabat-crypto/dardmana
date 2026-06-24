-- Nombre de produits affichés (best-sellers) et dans le slider vedette.
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "featuredProductsCount" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "featuredSliderCount" INTEGER NOT NULL DEFAULT 5;
