-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ListingProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mandateId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'PROPOSEE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingProposal_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "SearchMandate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingProposal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ListingProposal" ("createdAt", "id", "listingId", "mandateId") SELECT "createdAt", "id", "listingId", "mandateId" FROM "ListingProposal";
DROP TABLE "ListingProposal";
ALTER TABLE "new_ListingProposal" RENAME TO "ListingProposal";
CREATE INDEX "ListingProposal_mandateId_idx" ON "ListingProposal"("mandateId");
CREATE INDEX "ListingProposal_listingId_idx" ON "ListingProposal"("listingId");
CREATE UNIQUE INDEX "ListingProposal_mandateId_listingId_key" ON "ListingProposal"("mandateId", "listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
