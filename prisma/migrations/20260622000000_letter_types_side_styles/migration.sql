-- CreateTable: letter_types (نوع الحرف البارز = وجه + جوانب)
CREATE TABLE "letter_types" (
    "id"              TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "nameAr"          TEXT NOT NULL,
    "nameEn"          TEXT NOT NULL,
    "tagAr"           TEXT NOT NULL DEFAULT '',
    "faceMaterial"    TEXT NOT NULL,
    "sideMaterial"    TEXT NOT NULL,
    "lighting"        TEXT NOT NULL DEFAULT 'front',
    "rateMultiplier"  DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "gradientCss"     TEXT NOT NULL DEFAULT '',
    "availableColors" TEXT[],
    "colorful"        BOOLEAN NOT NULL DEFAULT true,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "letter_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "letter_types_slug_key" ON "letter_types"("slug");
CREATE INDEX "letter_types_isActive_sortOrder_idx" ON "letter_types"("isActive", "sortOrder");

-- Seed default letter types
INSERT INTO "letter_types" ("id","slug","nameAr","nameEn","tagAr","faceMaterial","sideMaterial","lighting","rateMultiplier","gradientCss","availableColors","colorful","isActive","sortOrder","updatedAt") VALUES
  ('lt_acrylic_alum', 'acrylic-alum', 'أكريليك + ألومنيوم', 'Acrylic + Aluminum', 'الأكثر مبيعاً', 'acrylic', 'aluminum', 'front', 0.7500, 'linear-gradient(135deg,#dff0ff,#f0f8ff,#cce4f8)', ARRAY['white','black','red','blue','green','gold','copper','silver'], true, true, 0, NOW()),
  ('lt_stainless',    'stainless',    'إستانلس ستيل',       'Stainless Steel',   'فاخر · عاكس',   'stainless','stainless', 'none',  2.8000, 'linear-gradient(135deg,#3a3a3a,#9aa0a6 45%,#e9edf0 60%,#7c7f84)', ARRAY['gold','silver'], false, true, 1, NOW()),
  ('lt_acrylic_zincor','acrylic-zincor','أكريليك + زنكور',  'Acrylic + Zincor',  'جوانب مخصصة',   'acrylic', 'zincor',   'front', 1.1000, 'linear-gradient(135deg,#ffdada,#fff0f0,#f8cccc)', ARRAY['white','black','red','blue','green','gold','silver'], true, true, 2, NOW()),
  ('lt_zincor_full',  'zincor-full',  'زنكور شامل',         'Full Zincor',       'هالة خلفية',     'zincor',  'zincor',   'back',  1.5000, 'linear-gradient(135deg,#2a3540,#1c252e)', ARRAY['white','black','red','blue','green','gold','copper','silver'], true, true, 3, NOW()),
  ('lt_acrylic_full', 'acrylic-full', 'أكريليك شامل',      'Full Acrylic',      'توهج كامل',      'acrylic', 'acrylic',  'both',  0.7500, 'linear-gradient(135deg,#ffe0a0,#fff4d0,#ffd060)', ARRAY['white','black','red','blue','green','gold','copper','silver'], true, true, 4, NOW());

-- CreateTable: side_styles (أنماط جوانب الحروف)
CREATE TABLE "side_styles" (
    "id"              TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "nameAr"          TEXT NOT NULL,
    "nameEn"          TEXT NOT NULL,
    "descriptionAr"   TEXT NOT NULL DEFAULT '',
    "svgPatternId"    TEXT NOT NULL DEFAULT '',
    "priceAddPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "metalOnly"       BOOLEAN NOT NULL DEFAULT true,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "side_styles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "side_styles_slug_key" ON "side_styles"("slug");
CREATE INDEX "side_styles_isActive_sortOrder_idx" ON "side_styles"("isActive", "sortOrder");

-- Seed default side styles
INSERT INTO "side_styles" ("id","slug","nameAr","nameEn","descriptionAr","svgPatternId","priceAddPercent","metalOnly","isActive","sortOrder","updatedAt") VALUES
  ('ss_solid',    'solid',    'صماء',          'Solid',          'جانب مصمت كلياً — الخيار الأساسي',         '',          0.00, true, true, 0, NOW()),
  ('ss_dots',     'dots',     'نقاط دائرية',   'Circular Dots',  'ثقوب دائرية منتظمة — ضوء ناعم ومتوزع',    'pat-dots',  8.00, true, true, 1, NOW()),
  ('ss_slots',    'slots',    'شرائح أفقية',   'Horizontal Slots','فتحات مستطيلة أفقية — ضوء متدرج مخطط',  'pat-slots', 8.00, true, true, 2, NOW()),
  ('ss_squares',  'squares',  'مربعات هندسية', 'Grid Squares',   'فتحات مربعة منتظمة — مظهر عصري نظيف',   'pat-grid', 10.00, true, true, 3, NOW()),
  ('ss_diamonds', 'diamonds', 'معينات',        'Diamonds',       'فتحات ماسية — مظهر فاخر راقٍ',            'pat-diamond',10.00,true, true, 4, NOW()),
  ('ss_arabic',   'arabic',   'نمط عربي',      'Arabic Pattern', 'زخرفة عربية أصيلة — ضوء دافئ ومتوهج',   'pat-arabic',15.00, true, true, 5, NOW());
