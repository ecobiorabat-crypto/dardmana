-- Section « Notre savoir-faire » (storytelling) éditable depuis l'admin.
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingEyebrowFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingEyebrowAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingEyebrowEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTitleFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTitleAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTitleEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTextFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTextAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingTextEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat1Value" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat1LabelFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat1LabelAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat1LabelEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat2Value" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat2LabelFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat2LabelAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat2LabelEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat3Value" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat3LabelFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat3LabelAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "stat3LabelEn" TEXT;

ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingButtonTextFr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingButtonTextAr" TEXT;
ALTER TABLE "HomepageSettings" ADD COLUMN IF NOT EXISTS "storytellingButtonTextEn" TEXT;
