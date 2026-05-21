-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "phone" TEXT,
    "phoneNormalized" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebookUrl" TEXT,
    "zaloUrl" TEXT,
    "bankAccount" TEXT,
    "bankAccountNormalized" TEXT,
    "bankName" TEXT,
    "bankOwnerName" TEXT,
    "openingHours" TEXT,
    "brandColor" TEXT,
    "sellerType" TEXT NOT NULL DEFAULT 'official_store',
    "source" TEXT NOT NULL DEFAULT 'admin_created',
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "baseTrustScore" INTEGER NOT NULL DEFAULT 80,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 80,
    "riskStatus" TEXT NOT NULL DEFAULT 'normal',
    "rating" REAL NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "successfulTransactions" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "hasPriceToday" BOOLEAN NOT NULL DEFAULT false,
    "ownerUserId" INTEGER,
    "createdByAdminId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Store_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Store" ("avatarUrl", "bankAccount", "bankAccountNormalized", "bankName", "bankOwnerName", "brandColor", "coverUrl", "createdAt", "description", "email", "facebookUrl", "hasPriceToday", "id", "name", "openingHours", "ownerUserId", "phone", "phoneNormalized", "rating", "rejectReason", "reviewCount", "slug", "status", "successfulTransactions", "trustScore", "updatedAt", "verificationStatus", "warningCount", "website", "zaloUrl") SELECT "avatarUrl", "bankAccount", "bankAccountNormalized", "bankName", "bankOwnerName", "brandColor", "coverUrl", "createdAt", "description", "email", "facebookUrl", "hasPriceToday", "id", "name", "openingHours", "ownerUserId", "phone", "phoneNormalized", "rating", "rejectReason", "reviewCount", "slug", "status", "successfulTransactions", "trustScore", "updatedAt", "verificationStatus", "warningCount", "website", "zaloUrl" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");
CREATE INDEX "Store_sellerType_idx" ON "Store"("sellerType");
CREATE INDEX "Store_verificationStatus_idx" ON "Store"("verificationStatus");
CREATE INDEX "Store_status_idx" ON "Store"("status");
CREATE INDEX "Store_riskStatus_idx" ON "Store"("riskStatus");
CREATE INDEX "Store_phoneNormalized_idx" ON "Store"("phoneNormalized");
CREATE INDEX "Store_bankAccountNormalized_idx" ON "Store"("bankAccountNormalized");
CREATE INDEX "Store_ownerUserId_idx" ON "Store"("ownerUserId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdByAdminId" INTEGER,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "displayName", "email", "id", "isLocked", "lastLoginAt", "lockReason", "passwordHash", "phone", "role", "trustScore") SELECT "createdAt", "displayName", "email", "id", "isLocked", "lastLoginAt", "lockReason", "passwordHash", "phone", "role", "trustScore" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
