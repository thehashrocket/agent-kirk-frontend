/*
  Warnings:

  - A unique constraint covering the columns `[emailCampaignId]` on the table `EmailCampaignContent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignContent_emailCampaignId_key" ON "EmailCampaignContent"("emailCampaignId");
