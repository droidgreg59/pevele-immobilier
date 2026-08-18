-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "statutRaison" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "siteWeb" TEXT,
    "googleAvisUrl" TEXT,
    "logoUrl" TEXT,
    "xmlImportUrl" TEXT,
    "xmlLastSyncAt" DATETIME,
    "xmlLastSyncCount" INTEGER,
    "xmlLastSyncError" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "categories" TEXT,
    "communesDesservies" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("adresse", "categories", "codePostal", "communesDesservies", "createdAt", "description", "email", "entreprise", "googleAvisUrl", "id", "logoUrl", "nom", "passwordHash", "siteWeb", "telephone", "type", "ville", "xmlImportUrl", "xmlLastSyncAt", "xmlLastSyncCount", "xmlLastSyncError") SELECT "adresse", "categories", "codePostal", "communesDesservies", "createdAt", "description", "email", "entreprise", "googleAvisUrl", "id", "logoUrl", "nom", "passwordHash", "siteWeb", "telephone", "type", "ville", "xmlImportUrl", "xmlLastSyncAt", "xmlLastSyncCount", "xmlLastSyncError" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
