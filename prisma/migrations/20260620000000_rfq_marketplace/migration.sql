-- ═══════════════════════════════════════════════════════════════
-- Migration: RFQ Marketplace
-- Adds: lat/lng to cities, AgencyRateCard, AgencyCoverage,
--       RFQ, InstantQuote, QuoteRevision, rfqId on marketplace_orders
-- ═══════════════════════════════════════════════════════════════

-- 1. Add coordinates to cities (required for distance-fee calculation)
ALTER TABLE "cities" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "cities" ADD COLUMN "lng" DOUBLE PRECISION;

-- 2. New ENUMs
CREATE TYPE "RFQStatus" AS ENUM (
  'OPEN',
  'QUOTED',
  'AWARDED',
  'CONFIRMED',
  'REVISED',
  'CLOSED',
  'CANCELLED'
);

CREATE TYPE "QuoteStatus" AS ENUM (
  'SENT',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REVISED',
  'REJECTED',
  'EXPIRED',
  'WITHDRAWN'
);

CREATE TYPE "RevisionReason" AS ENUM (
  'WALL_CONDITION',
  'ACCESS_ISSUE',
  'PERMIT_REQUIRED',
  'DISTANCE_CORRECTION',
  'MATERIAL_UNAVAILABLE',
  'SITE_SURVEY',
  'OTHER'
);

-- 3. AgencyRateCard — بطاقة أسعار المنفّذ
CREATE TABLE "agency_rate_cards" (
    "id"                   TEXT           NOT NULL,
    "agencyId"             TEXT           NOT NULL,
    "letterRatePerCm2"     DECIMAL(10,4)  NOT NULL DEFAULT 0.0500,
    "bgRatePerCm2"         DECIMAL(10,4)  NOT NULL DEFAULT 0.0200,
    "ledRatePerMeter"      DECIMAL(10,2)  NOT NULL DEFAULT 15.00,
    "installRateSAR"       DECIMAL(10,2)  NOT NULL DEFAULT 200.00,
    "minOrderSAR"          DECIMAL(10,2)  NOT NULL DEFAULT 500.00,
    "materialMultipliers"  JSONB,
    "validFrom"            TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil"           TIMESTAMP(3),
    "isActive"             BOOLEAN        NOT NULL DEFAULT true,
    "updatedAt"            TIMESTAMP(3)   NOT NULL,
    CONSTRAINT "agency_rate_cards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agency_rate_cards_agencyId_key" ON "agency_rate_cards"("agencyId");
ALTER TABLE "agency_rate_cards"
  ADD CONSTRAINT "agency_rate_cards_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. AgencyCoverage — نطاق التغطية + رسوم المسافة
CREATE TABLE "agency_coverages" (
    "id"             TEXT          NOT NULL,
    "agencyId"       TEXT          NOT NULL,
    "homeCityId"     TEXT          NOT NULL,
    "freeRadiusKm"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier1MaxKm"     DOUBLE PRECISION,
    "tier1RatePerKm" DECIMAL(8,2),
    "tier2MaxKm"     DOUBLE PRECISION,
    "tier2RatePerKm" DECIMAL(8,2),
    "isActive"       BOOLEAN       NOT NULL DEFAULT true,
    "updatedAt"      TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "agency_coverages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agency_coverages_agencyId_homeCityId_key" ON "agency_coverages"("agencyId", "homeCityId");
ALTER TABLE "agency_coverages"
  ADD CONSTRAINT "agency_coverages_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agency_coverages"
  ADD CONSTRAINT "agency_coverages_homeCityId_fkey"
  FOREIGN KEY ("homeCityId") REFERENCES "cities"("id") ON UPDATE CASCADE;

-- 5. AgencyCoverageCity — مدن إضافية ضمن التغطية
CREATE TABLE "agency_coverage_cities" (
    "id"         TEXT NOT NULL,
    "coverageId" TEXT NOT NULL,
    "cityId"     TEXT NOT NULL,
    CONSTRAINT "agency_coverage_cities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agency_coverage_cities_coverageId_cityId_key" ON "agency_coverage_cities"("coverageId", "cityId");
ALTER TABLE "agency_coverage_cities"
  ADD CONSTRAINT "agency_coverage_cities_coverageId_fkey"
  FOREIGN KEY ("coverageId") REFERENCES "agency_coverages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agency_coverage_cities"
  ADD CONSTRAINT "agency_coverage_cities_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON UPDATE CASCADE;

-- 6. RFQ — طلب عروض أسعار من المصمم
CREATE TABLE "rfqs" (
    "id"         TEXT         NOT NULL,
    "customerId" UUID         NOT NULL,
    "cityId"     TEXT         NOT NULL,
    "bom"        JSONB        NOT NULL,
    "designSnap" JSONB,
    "status"     "RFQStatus"  NOT NULL DEFAULT 'OPEN',
    "expiresAt"  TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rfqs_status_idx"     ON "rfqs"("status");
CREATE INDEX "rfqs_customerId_idx" ON "rfqs"("customerId");
ALTER TABLE "rfqs"
  ADD CONSTRAINT "rfqs_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "profiles"("id") ON UPDATE CASCADE;
ALTER TABLE "rfqs"
  ADD CONSTRAINT "rfqs_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON UPDATE CASCADE;

-- 7. InstantQuote — عرض سعر فوري لكل منفّذ
CREATE TABLE "instant_quotes" (
    "id"           TEXT          NOT NULL,
    "rfqId"        TEXT          NOT NULL,
    "agencyId"     TEXT          NOT NULL,
    "basePrice"    DECIMAL(10,2) NOT NULL,
    "distanceSAR"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPrice"   DECIMAL(10,2) NOT NULL,
    "agencyName"   TEXT          NOT NULL,
    "agencyRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER       NOT NULL,
    "notes"        TEXT,
    "status"       "QuoteStatus" NOT NULL DEFAULT 'SENT',
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "instant_quotes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "instant_quotes_rfqId_agencyId_key" ON "instant_quotes"("rfqId", "agencyId");
CREATE INDEX "instant_quotes_status_idx" ON "instant_quotes"("status");
ALTER TABLE "instant_quotes"
  ADD CONSTRAINT "instant_quotes_rfqId_fkey"
  FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instant_quotes"
  ADD CONSTRAINT "instant_quotes_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "agency_profiles"("id") ON UPDATE CASCADE;

-- 8. QuoteRevision — طلب تعديل سعر بعد مراجعة الموقع
CREATE TABLE "quote_revisions" (
    "id"               TEXT               NOT NULL,
    "quoteId"          TEXT               NOT NULL,
    "oldPrice"         DECIMAL(10,2)      NOT NULL,
    "newPrice"         DECIMAL(10,2)      NOT NULL,
    "reason"           "RevisionReason"   NOT NULL,
    "reasonNote"       TEXT,
    "customerApproved" BOOLEAN,
    "customerNote"     TEXT,
    "respondedAt"      TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quote_revisions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "instant_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Extend marketplace_orders: rfqId + selectedQuoteId (nullable — ether flow)
ALTER TABLE "marketplace_orders" ADD COLUMN "rfqId"           TEXT;
ALTER TABLE "marketplace_orders" ADD COLUMN "selectedQuoteId" TEXT;
CREATE UNIQUE INDEX "marketplace_orders_rfqId_key"           ON "marketplace_orders"("rfqId");
CREATE UNIQUE INDEX "marketplace_orders_selectedQuoteId_key" ON "marketplace_orders"("selectedQuoteId");
ALTER TABLE "marketplace_orders"
  ADD CONSTRAINT "marketplace_orders_rfqId_fkey"
  FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON UPDATE CASCADE;
ALTER TABLE "marketplace_orders"
  ADD CONSTRAINT "marketplace_orders_selectedQuoteId_fkey"
  FOREIGN KEY ("selectedQuoteId") REFERENCES "instant_quotes"("id") ON UPDATE CASCADE;

-- Make requestId / offerId nullable (now supports both Request and RFQ flows)
ALTER TABLE "marketplace_orders" ALTER COLUMN "requestId" DROP NOT NULL;
ALTER TABLE "marketplace_orders" ALTER COLUMN "offerId"   DROP NOT NULL;
