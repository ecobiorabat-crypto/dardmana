-- Notifications WhatsApp admin (nouvelle commande → numéro perso via CallMeBot).
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNotificationNumber" TEXT;
