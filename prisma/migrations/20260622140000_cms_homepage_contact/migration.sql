-- SiteSettings : coordonnées globales + réseaux sociaux.
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "socialInstagram" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "socialFacebook" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "socialTikTok" TEXT;

-- HomepageSettings : contenu éditable de la page d'accueil (singleton).
CREATE TABLE IF NOT EXISTS "HomepageSettings" (
  "id" TEXT NOT NULL,
  "heroTitleFr" TEXT,
  "heroTitleAr" TEXT,
  "heroTitleEn" TEXT,
  "heroSubtitleFr" TEXT,
  "heroSubtitleAr" TEXT,
  "heroSubtitleEn" TEXT,
  "announcementTextFr" TEXT,
  "announcementTextAr" TEXT,
  "announcementTextEn" TEXT,
  "announcementActive" BOOLEAN NOT NULL DEFAULT false,
  "featuredProductIds" TEXT[],
  "newsletterTitleFr" TEXT,
  "newsletterTitleAr" TEXT,
  "newsletterTitleEn" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSettings_pkey" PRIMARY KEY ("id")
);
