-- Configurator V2: raised-letter 5-step wizard tables

CREATE TABLE "lighting_types" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "basePriceSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iconEmoji" TEXT NOT NULL DEFAULT '💡',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lighting_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "face_options" (
    "id" TEXT NOT NULL,
    "lightingTypeId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "hasColorPicker" BOOLEAN NOT NULL DEFAULT false,
    "priceSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gradientCss" TEXT NOT NULL DEFAULT '',
    "iconEmoji" TEXT NOT NULL DEFAULT '🔲',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "face_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "side_metals" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "priceSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gradientCss" TEXT NOT NULL DEFAULT '',
    "iconEmoji" TEXT NOT NULL DEFAULT '🔩',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "side_metals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "side_addons" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "priceSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iconEmoji" TEXT NOT NULL DEFAULT '✨',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "side_addons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "light_colors" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "hexColor" TEXT NOT NULL,
    "priceSar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isColored" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "light_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_capabilities" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "supplierPriceSar" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_capabilities_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "lighting_types_slug_key" ON "lighting_types"("slug");
CREATE INDEX "lighting_types_isActive_sortOrder_idx" ON "lighting_types"("isActive", "sortOrder");

CREATE UNIQUE INDEX "face_options_slug_key" ON "face_options"("slug");
CREATE INDEX "face_options_lightingTypeId_isActive_idx" ON "face_options"("lightingTypeId", "isActive");

CREATE UNIQUE INDEX "side_metals_slug_key" ON "side_metals"("slug");
CREATE INDEX "side_metals_isActive_sortOrder_idx" ON "side_metals"("isActive", "sortOrder");

CREATE UNIQUE INDEX "side_addons_slug_key" ON "side_addons"("slug");
CREATE INDEX "side_addons_isActive_sortOrder_idx" ON "side_addons"("isActive", "sortOrder");

CREATE UNIQUE INDEX "light_colors_slug_key" ON "light_colors"("slug");
CREATE INDEX "light_colors_isActive_sortOrder_idx" ON "light_colors"("isActive", "sortOrder");

CREATE UNIQUE INDEX "supplier_capabilities_supplierId_entityType_entityId_key"
    ON "supplier_capabilities"("supplierId", "entityType", "entityId");
CREATE INDEX "supplier_capabilities_supplierId_isAvailable_idx"
    ON "supplier_capabilities"("supplierId", "isAvailable");

-- Foreign key
ALTER TABLE "face_options"
    ADD CONSTRAINT "face_options_lightingTypeId_fkey"
    FOREIGN KEY ("lightingTypeId") REFERENCES "lighting_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
