/*
  Warnings:

  - A unique constraint covering the columns `[gaAccountId]` on the table `GaAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gaPropertyId]` on the table `GaProperty` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GaAccount_gaAccountId_key" ON "GaAccount"("gaAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "GaProperty_gaPropertyId_key" ON "GaProperty"("gaPropertyId");
