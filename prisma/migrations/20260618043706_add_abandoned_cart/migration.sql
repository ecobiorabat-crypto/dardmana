-- CreateEnum
CREATE TYPE "AbandonedCartStatus" AS ENUM ('ACTIVE', 'RECOVERED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "customerName" TEXT,
    "items" JSONB NOT NULL,
    "totalMad" DECIMAL(65,30) NOT NULL,
    "status" "AbandonedCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbandonedCart_status_createdAt_idx" ON "AbandonedCart"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AbandonedCart_email_idx" ON "AbandonedCart"("email");

-- CreateIndex
CREATE INDEX "AbandonedCart_phone_idx" ON "AbandonedCart"("phone");
