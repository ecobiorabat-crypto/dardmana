-- Clé API Sendit.ma (chiffrée au repos), transporteur supplémentaire.
ALTER TABLE "DeliverySettings" ADD COLUMN IF NOT EXISTS "senditApiKey" TEXT;
