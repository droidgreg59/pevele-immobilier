-- AlterTable
ALTER TABLE "User" ADD COLUMN "adresse" TEXT;
ALTER TABLE "User" ADD COLUMN "codePostal" TEXT;
ALTER TABLE "User" ADD COLUMN "googleAvisUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "siteWeb" TEXT;
ALTER TABLE "User" ADD COLUMN "telephone" TEXT;
ALTER TABLE "User" ADD COLUMN "ville" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Review_agencyId_idx" ON "Review"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_agencyId_authorId_key" ON "Review"("agencyId", "authorId");
