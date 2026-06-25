-- Lien éditable du bouton « Découvrir notre histoire » (section savoir-faire).
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingButtonLink" TEXT DEFAULT '/notre-histoire';
