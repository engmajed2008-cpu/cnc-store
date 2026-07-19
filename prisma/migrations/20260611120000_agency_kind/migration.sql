-- CreateEnum
CREATE TYPE "AgencyKind" AS ENUM ('AD_AGENCY', 'MANUFACTURER');

-- AlterTable
ALTER TABLE "agency_profiles" ADD COLUMN     "kind" "AgencyKind" NOT NULL DEFAULT 'AD_AGENCY';
