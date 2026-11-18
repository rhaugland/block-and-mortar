-- CreateTable
CREATE TABLE "FeaturedBoost" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 2500,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedBoost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedBoost_businessId_idx" ON "FeaturedBoost"("businessId");

-- CreateIndex
CREATE INDEX "FeaturedBoost_date_idx" ON "FeaturedBoost"("date");

-- CreateIndex
CREATE INDEX "FeaturedBoost_status_idx" ON "FeaturedBoost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBoost_offerId_date_key" ON "FeaturedBoost"("offerId", "date");

-- AddForeignKey
ALTER TABLE "FeaturedBoost" ADD CONSTRAINT "FeaturedBoost_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedBoost" ADD CONSTRAINT "FeaturedBoost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
