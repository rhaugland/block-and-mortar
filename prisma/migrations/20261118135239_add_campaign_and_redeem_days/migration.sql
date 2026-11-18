-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "campaignDays" INTEGER,
ADD COLUMN     "redeemDays" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "Redemption" ADD COLUMN     "expiresAt" TIMESTAMP(3);
