-- Tuiles catégories éditables (titre/description/lien/images, FR/AR/EN).
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "categoryGrid" JSONB;
