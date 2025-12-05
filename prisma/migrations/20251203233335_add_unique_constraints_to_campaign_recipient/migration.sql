/*
  Warnings:

  - A unique constraint covering the columns `[uspsCampaignId,addressId]` on the table `CampaignRecipients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailCampaignId,email]` on the table `CampaignRecipients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipients_uspsCampaignId_addressId_key" ON "CampaignRecipients"("uspsCampaignId", "addressId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipients_emailCampaignId_email_key" ON "CampaignRecipients"("emailCampaignId", "email");
