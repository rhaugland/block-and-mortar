/*
  Warnings:

  - You are about to drop the column `toName` on the `OutboundEmail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OutboundEmail" DROP COLUMN "toName",
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "toFirstName" TEXT,
ADD COLUMN     "toLastName" TEXT;

-- CreateTable
CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundEmail_fromEmail_idx" ON "InboundEmail"("fromEmail");

-- CreateIndex
CREATE INDEX "InboundEmail_createdAt_idx" ON "InboundEmail"("createdAt");

-- CreateIndex
CREATE INDEX "InboundEmail_read_idx" ON "InboundEmail"("read");
