-- ═══════════════════════════════════════════════════════════════
-- RLS Policies — e3lani (cnc-store)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- NOTE: Prisma stores column names as camelCase in PostgreSQL
--       (no @map on individual fields), so all references use "camelCase".
--
-- Architecture:
--   • Prisma uses service_role key → bypasses RLS → API routes unaffected
--   • RLS blocks anon/authenticated direct table access
--   • Frontend directly queries only: complaints table
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. OTP TABLES — CRITICAL: phone numbers + code hashes
-- ──────────────────────────────────────────────────────────────

ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

-- ──────────────────────────────────────────────────────────────
-- 2. ADMIN TABLES — CRITICAL: passwordHash + session tokens
-- ──────────────────────────────────────────────────────────────

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

-- ──────────────────────────────────────────────────────────────
-- 3. PUBLIC CATALOG — safe for public read
-- ──────────────────────────────────────────────────────────────

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_materials"
  ON materials FOR SELECT USING ("isActive" = true);

ALTER TABLE thickness_price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_thickness_tiers"
  ON thickness_price_tiers FOR SELECT USING (true);

ALTER TABLE finish_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_finish_rates"
  ON finish_rates FOR SELECT USING ("isActive" = true);

ALTER TABLE urgency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_urgency_rates"
  ON urgency_rates FOR SELECT USING ("isActive" = true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT USING ("isActive" = true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT USING (status = 'active');

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_product_images"
  ON product_images FOR SELECT USING (true);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT USING (true);

ALTER TABLE pledge_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pledge_terms"
  ON pledge_terms FOR SELECT USING ("isActive" = true);

-- Geography / regulatory reference data
ALTER TABLE amanat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_amanat"
  ON amanat FOR SELECT USING ("isActive" = true);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cities"
  ON cities FOR SELECT USING ("isActive" = true);

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_municipalities"
  ON municipalities FOR SELECT USING ("isActive" = true);

ALTER TABLE regulatory_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_regulatory_guides"
  ON regulatory_guides FOR SELECT USING ("isActive" = true);

-- ──────────────────────────────────────────────────────────────
-- 4. PRICE HISTORY — admin audit trail only
-- ──────────────────────────────────────────────────────────────

ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

-- ──────────────────────────────────────────────────────────────
-- 5. ORDERS — sensitive customer data (phone, address...)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

-- ──────────────────────────────────────────────────────────────
-- 6. PROFILES — user owns their row (auth.uid() = profiles.id)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- 7. AGENCY & SUPPLIER PROFILES
-- ──────────────────────────────────────────────────────────────

ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_select_own"
  ON agency_profiles FOR SELECT
  USING (auth.uid() = "profileId");

CREATE POLICY "agency_update_own"
  ON agency_profiles FOR UPDATE
  USING (auth.uid() = "profileId");

CREATE POLICY "public_read_verified_agencies"
  ON agency_profiles FOR SELECT
  USING (verified = true);

ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_select_own"
  ON supplier_profiles FOR SELECT
  USING (auth.uid() = "profileId");

CREATE POLICY "supplier_update_own"
  ON supplier_profiles FOR UPDATE
  USING (auth.uid() = "profileId");

-- ──────────────────────────────────────────────────────────────
-- 8. REQUESTS — customer-owned; agencies browse OPEN/OFFERS
-- ──────────────────────────────────────────────────────────────

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_select_own_requests"
  ON requests FOR SELECT
  USING (auth.uid() = "customerId");

CREATE POLICY "customer_insert_request"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = "customerId");

CREATE POLICY "customer_update_own_request"
  ON requests FOR UPDATE
  USING (auth.uid() = "customerId" AND status IN ('OPEN', 'OFFERS'));

CREATE POLICY "agency_browse_open_requests"
  ON requests FOR SELECT
  USING (status IN ('OPEN', 'OFFERS'));

-- ──────────────────────────────────────────────────────────────
-- 9. OFFERS
-- ──────────────────────────────────────────────────────────────

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_manage_own_offers"
  ON offers FOR ALL
  USING (
    "agencyId" IN (
      SELECT id FROM agency_profiles WHERE "profileId" = auth.uid()
    )
  );

CREATE POLICY "customer_see_offers_on_own_requests"
  ON offers FOR SELECT
  USING (
    "requestId" IN (
      SELECT id FROM requests WHERE "customerId" = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 10. FINANCIAL DATA — service_role only
-- ──────────────────────────────────────────────────────────────

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- No policies → service_role (Prisma) only

-- ──────────────────────────────────────────────────────────────
-- 11. REVIEWS — public read; author can insert
-- ──────────────────────────────────────────────────────────────

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "customer_insert_own_review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = "authorId");

-- ──────────────────────────────────────────────────────────────
-- 12. COMPLAINTS — only table queried directly by frontend
-- ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaints'
  ) THEN
    EXECUTE 'ALTER TABLE complaints ENABLE ROW LEVEL SECURITY';

    EXECUTE $p$
      CREATE POLICY "authenticated_insert_complaint"
        ON complaints FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL)
    $p$;

    -- Let users see their own complaints if user_id column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'complaints'
        AND column_name = 'user_id'
    ) THEN
      EXECUTE $p$
        CREATE POLICY "user_select_own_complaints"
          ON complaints FOR SELECT
          USING (user_id::uuid = auth.uid())
      $p$;
    END IF;

  END IF;
END $$;
