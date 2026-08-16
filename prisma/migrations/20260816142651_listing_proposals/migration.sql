-- CreateTable
CREATE TABLE "ListingProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mandateId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingProposal_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "SearchMandate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingProposal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ListingProposal_mandateId_idx" ON "ListingProposal"("mandateId");

-- CreateIndex
CREATE INDEX "ListingProposal_listingId_idx" ON "ListingProposal"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingProposal_mandateId_listingId_key" ON "ListingProposal"("mandateId", "listingId");
