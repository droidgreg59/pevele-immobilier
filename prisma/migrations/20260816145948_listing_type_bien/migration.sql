-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "transaction" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_VERIFICATION',
    "typeBien" TEXT NOT NULL DEFAULT 'MAISON',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("badge", "chambres", "commune", "createdAt", "description", "dpe", "equipements", "exterieur", "id", "ownerId", "pieces", "prix", "statut", "surface", "titre", "transaction", "villageSlug") SELECT "badge", "chambres", "commune", "createdAt", "description", "dpe", "equipements", "exterieur", "id", "ownerId", "pieces", "prix", "statut", "surface", "titre", "transaction", "villageSlug" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_ownerId_idx" ON "Listing"("ownerId");
CREATE INDEX "Listing_transaction_statut_idx" ON "Listing"("transaction", "statut");
CREATE INDEX "Listing_villageSlug_idx" ON "Listing"("villageSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
