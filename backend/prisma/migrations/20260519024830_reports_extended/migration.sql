-- AlterTable
ALTER TABLE "FraudReport" ADD COLUMN "bankOwnerName" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "contactChannel" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "productName" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "region" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "reporterIp" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "reporterUA" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "sellerName" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "sellerShopName" TEXT;
ALTER TABLE "FraudReport" ADD COLUMN "socialLink" TEXT;

-- CreateTable
CREATE TABLE "ReportStatusLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportId" INTEGER NOT NULL,
    "changedById" INTEGER,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportStatusLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FraudReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReportStatusLog_reportId_idx" ON "ReportStatusLog"("reportId");

-- CreateIndex
CREATE INDEX "ReportStatusLog_changedById_idx" ON "ReportStatusLog"("changedById");
