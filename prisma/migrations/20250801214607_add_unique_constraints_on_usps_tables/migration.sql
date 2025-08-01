/*
  Warnings:

  - A unique constraint covering the columns `[campaignName]` on the table `UspsCampaign` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scanDate,uspsCampaignId]` on the table `UspsCampaignSummary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UspsCampaign_campaignName_key" ON "public"."UspsCampaign"("campaignName");

-- CreateIndex
CREATE UNIQUE INDEX "UspsCampaignSummary_scanDate_uspsCampaignId_key" ON "public"."UspsCampaignSummary"("scanDate", "uspsCampaignId");
