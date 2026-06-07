-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "coverUrl" TEXT,
    "logoUrl" TEXT,
    "lat" REAL,
    "lng" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "hours" TEXT,
    "googlePlaceId" TEXT,
    "googleRating" REAL,
    "googleReviewCount" INTEGER,
    "googlePhotosJson" TEXT,
    "googleDataSyncAt" DATETIME,
    "verificacaoStatus" TEXT NOT NULL DEFAULT 'NAO_SOLICITADA',
    "verificacaoMetodo" TEXT,
    "verificadoEm" DATETIME,
    "googleOwnerEmail" TEXT,
    "youtubeChannelId" TEXT,
    "youtubeChannelUrl" TEXT,
    "youtubeVideosJson" TEXT,
    "youtubeDataSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Business" ("address", "bairro", "category", "coverUrl", "createdAt", "description", "hours", "id", "instagram", "lat", "lng", "logoUrl", "name", "ownerId", "phone", "slug", "status", "updatedAt", "website", "whatsapp") SELECT "address", "bairro", "category", "coverUrl", "createdAt", "description", "hours", "id", "instagram", "lat", "lng", "logoUrl", "name", "ownerId", "phone", "slug", "status", "updatedAt", "website", "whatsapp" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE INDEX "Business_category_idx" ON "Business"("category");
CREATE INDEX "Business_bairro_idx" ON "Business"("bairro");
CREATE INDEX "Business_status_idx" ON "Business"("status");
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX "Business_googlePlaceId_idx" ON "Business"("googlePlaceId");
CREATE INDEX "Business_verificacaoStatus_idx" ON "Business"("verificacaoStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
