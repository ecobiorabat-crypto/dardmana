-- CreateTable
CREATE TABLE "DeliverySettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "activeProvider" TEXT NOT NULL DEFAULT 'MANUAL',
    "amanaApiKey" TEXT,
    "ctmApiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "DeliverySettings_pkey" PRIMARY KEY ("id")
);
