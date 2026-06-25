-- Activation/désactivation des pages & liens de navigation (JSON de booléens).
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "navConfig" JSONB NOT NULL DEFAULT '{}';
