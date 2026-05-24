-- ═══════════════════════════════════════════════════════════════
-- Metal Art — 001_init.sql
-- Full schema + seed data for pricing engine
-- Apply via: npx prisma migrate dev --name init
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension (if not using cuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
CREATE TYPE "FinishType"   AS ENUM ('raw','painted','powder','anodized');
CREATE TYPE "UrgencyType"  AS ENUM ('standard','express','urgent');
CREATE TYPE "OrderStatus"  AS ENUM ('pending','confirmed','in_progress','quality_check','ready','shipped','delivered','cancelled','refunded');
CREATE TYPE "PaymentMethod" AS ENUM ('mada','visa','apple_pay','tabby','tamara','stc_pay','bank_transfer','whatsapp');
CREATE TYPE "PaymentStatus" AS ENUM ('pending','paid','failed','refunded','partially_refunded');
CREATE TYPE "ProductStatus" AS ENUM ('draft','active','archived');
CREATE TYPE "AdminRole"    AS ENUM ('super_admin','admin','manager','viewer');

-- ─────────────────────────────────────────────────────────────
-- MATERIALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE materials (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug                 TEXT UNIQUE NOT NULL,
  name_ar              TEXT NOT NULL,
  name_en              TEXT NOT NULL,
  description_ar       TEXT DEFAULT '',
  description_en       TEXT DEFAULT '',
  icon                 TEXT DEFAULT '🔩',
  color                TEXT DEFAULT '#6B7280',
  base_price_per_cm2   NUMERIC(10,6) NOT NULL,
  cutting_multiplier   NUMERIC(6,4)  NOT NULL,
  min_order_sar        NUMERIC(10,2) NOT NULL,
  thickness_options_mm INTEGER[]     NOT NULL DEFAULT '{}',
  allowed_finishes     "FinishType"[] NOT NULL DEFAULT '{}',
  is_active            BOOLEAN DEFAULT TRUE,
  sort_order           INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Seed materials (mirrors the hard-coded MATERIAL_RATES)
INSERT INTO materials (slug, name_ar, name_en, icon, color, base_price_per_cm2, cutting_multiplier, min_order_sar, thickness_options_mm, allowed_finishes, sort_order) VALUES
  ('steel',    'حديد / ستيل',     'Steel / Iron',        '🔩', '#6B7280', 0.085000, 1.4000, 80.00,  ARRAY[1,2,3,4,5,6,8,10,12,15,20], ARRAY['raw','painted','powder']::"FinishType"[],    1),
  ('acrylic',  'أكريليك',         'Acrylic',             '💎', '#06B6D4', 0.120000, 0.9000, 60.00,  ARRAY[2,3,4,5,6,8,10,12,15,20],   ARRAY['raw','painted']::"FinishType"[],            2),
  ('cladding', 'كلادينج ألمنيوم', 'Aluminum Cladding',  '🏗️', '#C9A84C', 0.150000, 1.1000, 100.00, ARRAY[2,3,4,5,6],                  ARRAY['raw','painted','powder','anodized']::"FinishType"[], 3),
  ('wood',     'خشب MDF',         'MDF Wood',            '🪵', '#92400E', 0.055000, 0.7000, 45.00,  ARRAY[3,4,5,6,9,12,15,18,25],      ARRAY['raw','painted']::"FinishType"[],            4);

-- ─────────────────────────────────────────────────────────────
-- THICKNESS PRICE TIERS (per-material surcharge curve)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE thickness_price_tiers (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  min_mm      INTEGER NOT NULL,
  max_mm      INTEGER NOT NULL,
  multiplier  NUMERIC(6,4) NOT NULL,
  UNIQUE(material_id, min_mm)
);

-- Default tiers (apply to all materials unless overridden)
-- These are GLOBAL defaults stored in site_settings
-- Per-material overrides go here
INSERT INTO thickness_price_tiers (material_id, min_mm, max_mm, multiplier)
SELECT id, 1,  3,    1.0000 FROM materials WHERE slug = 'steel'
UNION ALL
SELECT id, 4,  6,    1.1500 FROM materials WHERE slug = 'steel'
UNION ALL
SELECT id, 7,  10,   1.3000 FROM materials WHERE slug = 'steel'
UNION ALL
SELECT id, 11, 15,   1.5000 FROM materials WHERE slug = 'steel'
UNION ALL
SELECT id, 16, 9999, 1.7500 FROM materials WHERE slug = 'steel'
UNION ALL
SELECT id, 2,  5,    1.0000 FROM materials WHERE slug = 'acrylic'
UNION ALL
SELECT id, 6,  10,   1.2000 FROM materials WHERE slug = 'acrylic'
UNION ALL
SELECT id, 11, 9999, 1.4000 FROM materials WHERE slug = 'acrylic'
UNION ALL
SELECT id, 2,  4,    1.0000 FROM materials WHERE slug = 'cladding'
UNION ALL
SELECT id, 5,  9999, 1.1500 FROM materials WHERE slug = 'cladding'
UNION ALL
SELECT id, 3,  6,    1.0000 FROM materials WHERE slug = 'wood'
UNION ALL
SELECT id, 7,  12,   1.1000 FROM materials WHERE slug = 'wood'
UNION ALL
SELECT id, 13, 9999, 1.2500 FROM materials WHERE slug = 'wood';

-- ─────────────────────────────────────────────────────────────
-- FINISH RATES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE finish_rates (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  finish          "FinishType" UNIQUE NOT NULL,
  name_ar         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  price_per_cm2   NUMERIC(10,6) NOT NULL DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  sort_order      INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO finish_rates (finish, name_ar, name_en, price_per_cm2, sort_order) VALUES
  ('raw',      'خام (بدون تشطيب)',  'Raw (No finish)',    0.000000, 1),
  ('painted',  'مطلي بالدهان',      'Spray Painted',     0.025000, 2),
  ('powder',   'طلاء بودرة',        'Powder Coating',    0.045000, 3),
  ('anodized', 'أنودايز',           'Anodized',          0.060000, 4);

-- ─────────────────────────────────────────────────────────────
-- URGENCY RATES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE urgency_rates (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  urgency        "UrgencyType" UNIQUE NOT NULL,
  name_ar        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  multiplier     NUMERIC(6,4) NOT NULL,
  lead_time_days TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  sort_order     INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO urgency_rates (urgency, name_ar, name_en, multiplier, lead_time_days, sort_order) VALUES
  ('standard', 'قياسي (7-10 أيام)',   'Standard (7-10 days)', 1.0000, '7-10', 1),
  ('express',  'سريع (3-5 أيام)',     'Express (3-5 days)',   1.2500, '3-5',  2),
  ('urgent',   'عاجل (24-48 ساعة)',   'Urgent (24-48 hrs)',   1.6000, '1-2',  3);

-- ─────────────────────────────────────────────────────────────
-- MATERIAL PRICE HISTORY (audit log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE material_price_history (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  material_id        TEXT NOT NULL REFERENCES materials(id),
  changed_by         TEXT NOT NULL,
  old_price_per_cm2  NUMERIC(10,6),
  new_price_per_cm2  NUMERIC(10,6),
  old_cutting_mult   NUMERIC(6,4),
  new_cutting_mult   NUMERIC(6,4),
  reason             TEXT DEFAULT '',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug         TEXT UNIQUE NOT NULL,
  name_ar      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  desc_ar      TEXT DEFAULT '',
  desc_en      TEXT DEFAULT '',
  icon         TEXT DEFAULT '📦',
  cover_image  TEXT,
  sort_order   INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (slug, name_ar, name_en, icon, sort_order) VALUES
  ('cnc',         'قص CNC',                  'CNC Cutting',        '⚙️', 1),
  ('decor',       'ديكور فني',                'Artistic Decor',     '🎨', 2),
  ('signs',       'اللوحات والافتات',         'Signage & Panels',   '🪧', 3),
  ('advertising', 'منتجات الدعاية والإعلان', 'Advertising',        '📢', 4),
  ('design',      'التصميم الجرافيكي',       'Graphic Design',     '✏️', 5);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE products (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug             TEXT UNIQUE NOT NULL,
  category_id      TEXT NOT NULL REFERENCES categories(id),
  name_ar          TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  description_ar   TEXT DEFAULT '',
  description_en   TEXT DEFAULT '',
  tagline_ar       TEXT DEFAULT '',
  tagline_en       TEXT DEFAULT '',
  base_price_sar   NUMERIC(10,2),
  is_custom_price  BOOLEAN DEFAULT FALSE,
  tags             TEXT[]  DEFAULT '{}',
  status           "ProductStatus" DEFAULT 'draft',
  is_featured      BOOLEAN DEFAULT FALSE,
  is_best_seller   BOOLEAN DEFAULT FALSE,
  is_new           BOOLEAN DEFAULT FALSE,
  sort_order       INTEGER DEFAULT 0,
  view_count       INTEGER DEFAULT 0,
  material_id      TEXT REFERENCES materials(id),
  default_finish   "FinishType",
  meta_title_ar    TEXT DEFAULT '',
  meta_title_en    TEXT DEFAULT '',
  meta_desc_ar     TEXT DEFAULT '',
  meta_desc_en     TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  alt_ar       TEXT DEFAULT '',
  alt_en       TEXT DEFAULT '',
  sort_order   INTEGER DEFAULT 0,
  is_primary   BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_number     TEXT UNIQUE NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_email   TEXT,
  city             TEXT NOT NULL,
  district         TEXT NOT NULL,
  street           TEXT NOT NULL,
  zip_code         TEXT,
  delivery_notes   TEXT,
  subtotal_sar     NUMERIC(10,2) NOT NULL,
  discount_sar     NUMERIC(10,2) DEFAULT 0,
  shipping_sar     NUMERIC(10,2) DEFAULT 0,
  vat_sar          NUMERIC(10,2) NOT NULL,
  total_sar        NUMERIC(10,2) NOT NULL,
  coupon_code      TEXT,
  payment_method   "PaymentMethod" NOT NULL,
  payment_status   "PaymentStatus" DEFAULT 'pending',
  gateway_ref      TEXT,
  paid_at          TIMESTAMPTZ,
  status           "OrderStatus" DEFAULT 'pending',
  locale           TEXT DEFAULT 'ar',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_orders_phone  ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date   ON orders(created_at DESC);

CREATE TABLE order_items (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       TEXT REFERENCES products(id),
  material_id      TEXT REFERENCES materials(id),
  material_slug    TEXT NOT NULL,
  material_name_ar TEXT NOT NULL,
  material_name_en TEXT NOT NULL,
  thickness_mm     INTEGER NOT NULL,
  width_cm         NUMERIC(8,2) NOT NULL,
  height_cm        NUMERIC(8,2) NOT NULL,
  quantity         INTEGER NOT NULL,
  finish           "FinishType" NOT NULL,
  urgency          "UrgencyType" NOT NULL,
  unit_price_sar   NUMERIC(10,2) NOT NULL,
  total_price_sar  NUMERIC(10,2) NOT NULL,
  area_cm2         INTEGER NOT NULL,
  note             TEXT,
  design_file_name TEXT
);

CREATE TABLE order_status_history (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id   TEXT NOT NULL REFERENCES orders(id),
  status     "OrderStatus" NOT NULL,
  note       TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_files (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id     TEXT NOT NULL REFERENCES orders(id),
  file_name    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  mime_type    TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ADMIN
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admin_users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          "AdminRole" DEFAULT 'viewer',
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_user_id TEXT NOT NULL,
  token         TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON admin_sessions(token);

-- ─────────────────────────────────────────────────────────────
-- SITE SETTINGS (global key-value config)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT DEFAULT '',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed global settings
INSERT INTO site_settings (key, value, label) VALUES
  ('vat_rate',                  '0.15',  'نسبة ضريبة القيمة المضافة'),
  ('usd_rate',                  '3.75',  'سعر الدولار الأمريكي مقابل الريال'),
  ('free_shipping_threshold',   '500',   'حد الشحن المجاني (ريال)'),
  ('standard_shipping_fee',     '45',    'رسوم الشحن الثابتة (ريال)'),
  ('bulk_discount_5_pct_qty',   '5',     'الحد الأدنى للخصم 5%'),
  ('bulk_discount_10_pct_qty',  '20',    'الحد الأدنى للخصم 10%'),
  ('default_thickness_tiers',   '[{"min":1,"max":3,"mult":1.0},{"min":4,"max":6,"mult":1.15},{"min":7,"max":10,"mult":1.3},{"min":11,"max":15,"mult":1.5},{"min":16,"max":9999,"mult":1.75}]', 'معاملات السماكة الافتراضية');

-- ─────────────────────────────────────────────────────────────
-- auto-update updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['materials','categories','products','orders','admin_users','site_settings'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl, tbl);
  END LOOP;
END $$;
