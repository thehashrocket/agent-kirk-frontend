/*
  Warnings:

  - A unique constraint covering the columns `[emailClientId,date]` on the table `EmailGlobalDailyStats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailGlobalDailyStats_emailClientId_date_key" ON "EmailGlobalDailyStats"("emailClientId", "date");
