-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "group" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updatedById" INTEGER,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "desktopImageUrl" TEXT,
    "mobileImageUrl" TEXT,
    "ctaPrimaryLabel" TEXT,
    "ctaPrimaryUrl" TEXT,
    "ctaSecondaryLabel" TEXT,
    "ctaSecondaryUrl" TEXT,
    "position" TEXT NOT NULL DEFAULT 'home_hero',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startAt" DATETIME,
    "endAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "usageType" TEXT NOT NULL DEFAULT 'public_media',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "uploadedById" INTEGER,
    "reportId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Seller" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneEntityId" INTEGER,
    "bankAccount" TEXT,
    "accountEntityId" INTEGER,
    "bankName" TEXT,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "coverUrl" TEXT,
    "mobileCoverUrl" TEXT,
    "brandColor" TEXT,
    "slogan" TEXT,
    "featuredImageUrl" TEXT,
    "brandingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "brandingRejectReason" TEXT,
    "brandingApprovedById" INTEGER,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    CONSTRAINT "Seller_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Seller_phoneEntityId_fkey" FOREIGN KEY ("phoneEntityId") REFERENCES "LookupEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Seller_accountEntityId_fkey" FOREIGN KEY ("accountEntityId") REFERENCES "LookupEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Seller" ("accountEntityId", "approvedById", "bankAccount", "bankName", "createdAt", "description", "id", "location", "name", "ordersCount", "phone", "phoneEntityId", "ratingAvg", "rejectReason", "status", "submittedById", "thumbnailUrl") SELECT "accountEntityId", "approvedById", "bankAccount", "bankName", "createdAt", "description", "id", "location", "name", "ordersCount", "phone", "phoneEntityId", "ratingAvg", "rejectReason", "status", "submittedById", "thumbnailUrl" FROM "Seller";
DROP TABLE "Seller";
ALTER TABLE "new_Seller" RENAME TO "Seller";
CREATE INDEX "Seller_phoneEntityId_idx" ON "Seller"("phoneEntityId");
CREATE INDEX "Seller_accountEntityId_idx" ON "Seller"("accountEntityId");
CREATE INDEX "Seller_status_idx" ON "Seller"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SiteSetting_group_idx" ON "SiteSetting"("group");

-- CreateIndex
CREATE INDEX "Banner_position_status_idx" ON "Banner"("position", "status");

-- CreateIndex
CREATE INDEX "Banner_sortOrder_idx" ON "Banner"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_fileUrl_key" ON "MediaAsset"("fileUrl");

-- CreateIndex
CREATE INDEX "MediaAsset_usageType_idx" ON "MediaAsset"("usageType");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedById_idx" ON "MediaAsset"("uploadedById");
