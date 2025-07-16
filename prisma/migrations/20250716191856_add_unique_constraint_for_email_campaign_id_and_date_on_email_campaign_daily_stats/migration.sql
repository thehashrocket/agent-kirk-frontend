/*
  Warnings:

  - A unique constraint covering the columns `[emailCampaignId,date]` on the table `EmailCampaignDailyStats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignDailyStats_emailCampaignId_date_key" ON "EmailCampaignDailyStats"("emailCampaignId", "date");
