/*
  Warnings:

  - Added the required column `gaAccountId` to the `GaProperty` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GaProperty" DROP CONSTRAINT "GaProperty_gaPropertyId_fkey";

-- AlterTable
ALTER TABLE "GaProperty" ADD COLUMN     "gaAccountId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "GaProperty" ADD CONSTRAINT "GaProperty_gaAccountId_fkey" FOREIGN KEY ("gaAccountId") REFERENCES "GaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
