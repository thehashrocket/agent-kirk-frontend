-- DropForeignKey
ALTER TABLE "EmailCampaignDailyStats" DROP CONSTRAINT "EmailCampaignDailyStats_emailCampaignId_fkey";

-- AddForeignKey
ALTER TABLE "EmailCampaignDailyStats" ADD CONSTRAINT "EmailCampaignDailyStats_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "EmailCampaign"("campaignId") ON DELETE RESTRICT ON UPDATE CASCADE;
