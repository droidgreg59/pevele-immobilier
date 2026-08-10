-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PriceHistory_listingId_idx" ON "PriceHistory"("listingId");
