-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'AGENCY', 'SUPPLIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('SERVICE', 'MATERIAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'OFFERS', 'AWARDED', 'IN_PROGRESS', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('NONE', 'HELD', 'RELEASED', 'REFUNDED');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "kind" "CategoryKind" NOT NULL DEFAULT 'SERVICE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "supplierId" TEXT;

-- CreateTable
CREATE TABLE "amanat" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amanat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "amanaId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_guides" (
    "id" TEXT NOT NULL,
    "amanaId" TEXT NOT NULL,
    "municipalityId" TEXT,
    "version" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "rules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulatory_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_profiles" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "crNumber" TEXT,
    "amanaId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "isAnchor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_profiles" (
    "id" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "crNumber" TEXT,
    "amanaId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specs" JSONB NOT NULL,
    "attachments" TEXT[],
    "budgetEstimate" DECIMAL(10,2),
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "guideId" TEXT,
    "guideVersion" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "notes" TEXT,
    "attachments" TEXT[],
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "agencyId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'mada',
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "agencyId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "municipalities_amanaId_idx" ON "municipalities"("amanaId");

-- CreateIndex
CREATE INDEX "regulatory_guides_amanaId_isActive_idx" ON "regulatory_guides"("amanaId", "isActive");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "agency_profiles_profileId_key" ON "agency_profiles"("profileId");

-- CreateIndex
CREATE INDEX "agency_profiles_verified_idx" ON "agency_profiles"("verified");

-- CreateIndex
CREATE INDEX "agency_profiles_amanaId_idx" ON "agency_profiles"("amanaId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_profiles_profileId_key" ON "supplier_profiles"("profileId");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_municipalityId_status_idx" ON "requests"("municipalityId", "status");

-- CreateIndex
CREATE INDEX "requests_categoryId_idx" ON "requests"("categoryId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "offers_requestId_agencyId_key" ON "offers"("requestId", "agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_requestId_key" ON "marketplace_orders"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_offerId_key" ON "marketplace_orders"("offerId");

-- CreateIndex
CREATE INDEX "marketplace_orders_escrowStatus_idx" ON "marketplace_orders"("escrowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_amanaId_fkey" FOREIGN KEY ("amanaId") REFERENCES "amanat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_guides" ADD CONSTRAINT "regulatory_guides_amanaId_fkey" FOREIGN KEY ("amanaId") REFERENCES "amanat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_guides" ADD CONSTRAINT "regulatory_guides_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_profiles" ADD CONSTRAINT "agency_profiles_amanaId_fkey" FOREIGN KEY ("amanaId") REFERENCES "amanat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_amanaId_fkey" FOREIGN KEY ("amanaId") REFERENCES "amanat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
