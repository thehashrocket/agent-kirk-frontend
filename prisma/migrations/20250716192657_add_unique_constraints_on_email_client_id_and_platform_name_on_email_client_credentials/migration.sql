/*
  Warnings:

  - A unique constraint covering the columns `[emailClientId,platformName]` on the table `EmailClientCredentials` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailClientCredentials_emailClientId_platformName_key" ON "EmailClientCredentials"("emailClientId", "platformName");
