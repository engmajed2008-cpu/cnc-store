-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "amanaId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cities_amanaId_isActive_idx" ON "cities"("amanaId", "isActive");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_amanaId_fkey" FOREIGN KEY ("amanaId") REFERENCES "amanat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
