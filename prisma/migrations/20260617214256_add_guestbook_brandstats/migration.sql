-- CreateEnum
CREATE TYPE "GuestbookSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateTable
CREATE TABLE "GuestbookEntry" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCity" TEXT,
    "customerCountry" TEXT DEFAULT 'MA',
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "mediaUrl" TEXT,
    "mediaType" "MediaType",
    "productTag" TEXT,
    "source" "GuestbookSource" NOT NULL DEFAULT 'WEBSITE',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "isVerifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandStats" (
    "id" TEXT NOT NULL,
    "tiktokFollowers" INTEGER NOT NULL DEFAULT 0,
    "tiktokLikes" INTEGER NOT NULL DEFAULT 0,
    "tiktokHandle" TEXT DEFAULT '@dardmana',
    "googleRating" DOUBLE PRECISION DEFAULT 0,
    "googleReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "satisfactionRate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "BrandStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuestbookEntry_isApproved_createdAt_idx" ON "GuestbookEntry"("isApproved", "createdAt");

-- CreateIndex
CREATE INDEX "GuestbookEntry_isFeatured_idx" ON "GuestbookEntry"("isFeatured");
