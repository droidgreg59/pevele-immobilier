-- CreateTable
CREATE TABLE "DvfTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "villageSlug" TEXT NOT NULL,
    "dateMutation" DATETIME NOT NULL,
    "typeLocal" TEXT NOT NULL,
    "valeurFonciere" INTEGER NOT NULL,
    "surfaceBati" INTEGER NOT NULL,
    "prixM2" INTEGER NOT NULL,
    "nombrePieces" INTEGER,
    "adresse" TEXT,
    "sourceAnnee" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "DvfTransaction_villageSlug_idx" ON "DvfTransaction"("villageSlug");
