-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "clickCount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "tremendousId" TEXT,
    "tremendousLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payout_propertyId_idx" ON "Payout"("propertyId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
