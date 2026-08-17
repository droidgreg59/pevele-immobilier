-- AlterTable
ALTER TABLE "User" ADD COLUMN "xmlImportUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "xmlLastSyncAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "xmlLastSyncCount" INTEGER;
ALTER TABLE "User" ADD COLUMN "xmlLastSyncError" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "externalRef" TEXT;
ALTER TABLE "Listing" ADD COLUMN "importSource" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Listing_ownerId_externalRef_key" ON "Listing"("ownerId", "externalRef");
