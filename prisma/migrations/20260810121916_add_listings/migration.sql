-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "transaction" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_VERIFICATION',
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,
    "commune" TEXT NOT NULL,
    "villageSlug" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL,
    "chambres" INTEGER NOT NULL,
    "surface" INTEGER NOT NULL,
    "exterieur" TEXT NOT NULL,
    "dpe" TEXT,
    "equipements" TEXT NOT NULL DEFAULT '',
    "badge" TEXT,
    "photo" TEXT,
    "photoLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");

-- CreateIndex
CREATE INDEX "Listing_transaction_statut_idx" ON "Listing"("transaction", "statut");

-- CreateIndex
CREATE INDEX "Listing_villageSlug_idx" ON "Listing"("villageSlug");
