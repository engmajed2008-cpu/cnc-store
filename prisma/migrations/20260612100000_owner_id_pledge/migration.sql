-- AlterTable
ALTER TABLE "agency_profiles" ADD COLUMN     "crNumberType" TEXT DEFAULT 'CR',
ADD COLUMN     "ownerIdDocPath" TEXT,
ADD COLUMN     "ownerIdNumber" TEXT,
ADD COLUMN     "pledgeAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "supplier_profiles" ADD COLUMN     "crNumberType" TEXT DEFAULT 'CR',
ADD COLUMN     "ownerIdDocPath" TEXT,
ADD COLUMN     "ownerIdNumber" TEXT,
ADD COLUMN     "pledgeAcceptedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "pledge_terms" (
    "id" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "textEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pledge_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pledge_terms_isActive_sortOrder_idx" ON "pledge_terms"("isActive", "sortOrder");
