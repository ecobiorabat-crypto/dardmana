-- Email devient optionnel et perd sa contrainte d'unicité.
-- Le téléphone devient la clé d'unicité (import par téléphone).
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;
DROP INDEX IF EXISTS "Customer_email_key";
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
