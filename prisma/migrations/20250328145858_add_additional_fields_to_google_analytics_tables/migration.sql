/*
  Warnings:

  - Added the required column `gaAccountName` to the `GaAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gaPropertyName` to the `GaProperty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GaAccount" ADD COLUMN     "gaAccountName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GaProperty" ADD COLUMN     "gaPropertyName" TEXT NOT NULL;
