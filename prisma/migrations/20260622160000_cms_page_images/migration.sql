-- Médias éditables pour les pages CMS : image principale + galerie.
ALTER TABLE "CMSPage" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
ALTER TABLE "CMSPage" ADD COLUMN IF NOT EXISTS "galleryImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
