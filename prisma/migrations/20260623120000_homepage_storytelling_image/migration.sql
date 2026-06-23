-- Image de la section savoir-faire (colonne droite) éditable depuis l'admin.
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingImageUrl" TEXT;
