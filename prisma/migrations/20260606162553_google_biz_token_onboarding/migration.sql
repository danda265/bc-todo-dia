-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TURISTA',
    "bairro" TEXT,
    "interests" TEXT,
    "consentAcceptedAt" DATETIME,
    "consentVersion" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "googleBizAccessToken" TEXT,
    "googleBizRefreshToken" TEXT,
    "googleBizExpiresAt" DATETIME,
    "googleBizEmail" TEXT,
    "googleBizConnectedAt" DATETIME,
    "onboardingCompleto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bairro", "consentAcceptedAt", "consentVersion", "createdAt", "email", "emailVerified", "id", "image", "interests", "marketingOptIn", "name", "password", "role", "updatedAt") SELECT "bairro", "consentAcceptedAt", "consentVersion", "createdAt", "email", "emailVerified", "id", "image", "interests", "marketingOptIn", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
