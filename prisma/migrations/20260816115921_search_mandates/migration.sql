-- CreateTable
CREATE TABLE "SearchMandate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedSearchId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    CONSTRAINT "SearchMandate_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SearchMandate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SearchMandate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SearchMandate_agencyId_idx" ON "SearchMandate"("agencyId");

-- CreateIndex
CREATE INDEX "SearchMandate_clientId_idx" ON "SearchMandate"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchMandate_savedSearchId_agencyId_key" ON "SearchMandate"("savedSearchId", "agencyId");
