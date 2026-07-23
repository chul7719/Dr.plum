-- CreateEnum
CREATE TYPE "RegionLevel" AS ENUM ('SIDO', 'SGG', 'DONG');

-- CreateTable
CREATE TABLE "VendorRegion" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "level" "RegionLevel" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorRegion_vendorId_level_code_key" ON "VendorRegion"("vendorId", "level", "code");

-- AddForeignKey
ALTER TABLE "VendorRegion" ADD CONSTRAINT "VendorRegion_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
