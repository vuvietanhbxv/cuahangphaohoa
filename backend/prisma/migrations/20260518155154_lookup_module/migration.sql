-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LookupEntity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "bankName" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Seller" (
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

-- CreateTable
CREATE TABLE "SellerReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerReview_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SellerReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityId" INTEGER NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "reasonText" TEXT,
    "detail" TEXT,
    "amount" INTEGER,
    "transactionDate" DATETIME,
    "relatedAccountEntityId" INTEGER,
    "evidenceUrls" TEXT NOT NULL DEFAULT '[]',
    "riskLevelInput" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "adminNote" TEXT,
    "duplicateOfId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    CONSTRAINT "FraudReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FraudReport_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "LookupEntity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FraudReport_relatedAccountEntityId_fkey" FOREIGN KEY ("relatedAccountEntityId") REFERENCES "LookupEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FraudReport_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "FraudReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LookupLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "lookupType" TEXT NOT NULL,
    "queryRaw" TEXT NOT NULL,
    "queryNormalized" TEXT NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "resultRiskScore" INTEGER,
    "entityId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LookupLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LookupLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "LookupEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT
);

-- CreateTable
CREATE TABLE "PriceSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeUrl" TEXT,
    "priceDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    CONSTRAINT "PriceSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PriceSubmission_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "avg" INTEGER NOT NULL,
    "low" INTEGER NOT NULL,
    "high" INTEGER NOT NULL,
    "storeCount" INTEGER NOT NULL,
    CONSTRAINT "DailyPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LookupEntity_type_idx" ON "LookupEntity"("type");

-- CreateIndex
CREATE INDEX "LookupEntity_normalizedValue_idx" ON "LookupEntity"("normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "LookupEntity_type_normalizedValue_key" ON "LookupEntity"("type", "normalizedValue");

-- CreateIndex
CREATE INDEX "Seller_phoneEntityId_idx" ON "Seller"("phoneEntityId");

-- CreateIndex
CREATE INDEX "Seller_accountEntityId_idx" ON "Seller"("accountEntityId");

-- CreateIndex
CREATE INDEX "Seller_status_idx" ON "Seller"("status");

-- CreateIndex
CREATE INDEX "SellerReview_sellerId_idx" ON "SellerReview"("sellerId");

-- CreateIndex
CREATE INDEX "SellerReview_status_idx" ON "SellerReview"("status");

-- CreateIndex
CREATE INDEX "FraudReport_entityId_idx" ON "FraudReport"("entityId");

-- CreateIndex
CREATE INDEX "FraudReport_status_idx" ON "FraudReport"("status");

-- CreateIndex
CREATE INDEX "FraudReport_reasonCode_idx" ON "FraudReport"("reasonCode");

-- CreateIndex
CREATE INDEX "FraudReport_submittedById_entityId_idx" ON "FraudReport"("submittedById", "entityId");

-- CreateIndex
CREATE INDEX "LookupLog_lookupType_queryNormalized_idx" ON "LookupLog"("lookupType", "queryNormalized");

-- CreateIndex
CREATE INDEX "LookupLog_createdAt_idx" ON "LookupLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "PriceSubmission_productId_region_priceDate_idx" ON "PriceSubmission"("productId", "region", "priceDate");

-- CreateIndex
CREATE INDEX "PriceSubmission_status_idx" ON "PriceSubmission"("status");

-- CreateIndex
CREATE INDEX "DailyPrice_productId_region_date_idx" ON "DailyPrice"("productId", "region", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrice_productId_region_date_key" ON "DailyPrice"("productId", "region", "date");
