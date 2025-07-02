/*
  Warnings:

  - You are about to drop the column `campaign_id` on the `EmailCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `campaign_name` on the `EmailCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `email_client_id` on the `EmailCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `content_type` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `create_time` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `email_campaign_id` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `html_content` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `plain_content` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `send_time` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `web_id` on the `EmailCampaignContent` table. All the data in the column will be lost.
  - You are about to drop the column `bounce_drops` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_bounce_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_spam_reports_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_total_click_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_total_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_unique_click_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_unique_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `cumulative_unsubscribe_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_bounce_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_spam_reports_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_total_click_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_total_click_to_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_total_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_unique_click_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_unique_click_to_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_unique_open_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `daily_unsubscribe_rate` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `email_campaign_id` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `email_client_id` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `single_send_name` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `spam_report_drops` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `spam_reports` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `total_clicks` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `total_opens` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `unique_clicks` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `unique_opens` on the `EmailCampaignDailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `client_name` on the `EmailClient` table. All the data in the column will be lost.
  - You are about to drop the column `api_key` on the `EmailClientCredentials` table. All the data in the column will be lost.
  - You are about to drop the column `email_client_id` on the `EmailClientCredentials` table. All the data in the column will be lost.
  - You are about to drop the column `platform_name` on the `EmailClientCredentials` table. All the data in the column will be lost.
  - You are about to drop the column `email_client_id` on the `EmailGlobalDailyStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignId]` on the table `EmailCampaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campaignId` to the `EmailCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campaignName` to the `EmailCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailClientId` to the `EmailCampaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentType` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createTime` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailCampaignId` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `htmlContent` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plainContent` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sendTime` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webId` to the `EmailCampaignContent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailCampaignId` to the `EmailCampaignDailyStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailClientId` to the `EmailCampaignDailyStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `singleSendName` to the `EmailCampaignDailyStats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientName` to the `EmailClient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apiKey` to the `EmailClientCredentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailClientId` to the `EmailClientCredentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformName` to the `EmailClientCredentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailClientId` to the `EmailGlobalDailyStats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmailCampaign" DROP CONSTRAINT "EmailCampaign_email_client_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailCampaignContent" DROP CONSTRAINT "EmailCampaignContent_email_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailCampaignDailyStats" DROP CONSTRAINT "EmailCampaignDailyStats_email_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailCampaignDailyStats" DROP CONSTRAINT "EmailCampaignDailyStats_email_client_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailClientCredentials" DROP CONSTRAINT "EmailClientCredentials_email_client_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailGlobalDailyStats" DROP CONSTRAINT "EmailGlobalDailyStats_email_client_id_fkey";

-- DropIndex
DROP INDEX "EmailCampaign_campaign_id_key";

-- AlterTable
ALTER TABLE "EmailCampaign" DROP COLUMN "campaign_id",
DROP COLUMN "campaign_name",
DROP COLUMN "email_client_id",
ADD COLUMN     "campaignId" TEXT NOT NULL,
ADD COLUMN     "campaignName" TEXT NOT NULL,
ADD COLUMN     "emailClientId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailCampaignContent" DROP COLUMN "content_type",
DROP COLUMN "create_time",
DROP COLUMN "email_campaign_id",
DROP COLUMN "html_content",
DROP COLUMN "plain_content",
DROP COLUMN "send_time",
DROP COLUMN "web_id",
ADD COLUMN     "contentType" TEXT NOT NULL,
ADD COLUMN     "createTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "emailCampaignId" TEXT NOT NULL,
ADD COLUMN     "htmlContent" TEXT NOT NULL,
ADD COLUMN     "plainContent" TEXT NOT NULL,
ADD COLUMN     "sendTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "webId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailCampaignDailyStats" DROP COLUMN "bounce_drops",
DROP COLUMN "cumulative_bounce_rate",
DROP COLUMN "cumulative_spam_reports_rate",
DROP COLUMN "cumulative_total_click_rate",
DROP COLUMN "cumulative_total_open_rate",
DROP COLUMN "cumulative_unique_click_rate",
DROP COLUMN "cumulative_unique_open_rate",
DROP COLUMN "cumulative_unsubscribe_rate",
DROP COLUMN "daily_bounce_rate",
DROP COLUMN "daily_spam_reports_rate",
DROP COLUMN "daily_total_click_rate",
DROP COLUMN "daily_total_click_to_open_rate",
DROP COLUMN "daily_total_open_rate",
DROP COLUMN "daily_unique_click_rate",
DROP COLUMN "daily_unique_click_to_open_rate",
DROP COLUMN "daily_unique_open_rate",
DROP COLUMN "daily_unsubscribe_rate",
DROP COLUMN "email_campaign_id",
DROP COLUMN "email_client_id",
DROP COLUMN "single_send_name",
DROP COLUMN "spam_report_drops",
DROP COLUMN "spam_reports",
DROP COLUMN "total_clicks",
DROP COLUMN "total_opens",
DROP COLUMN "unique_clicks",
DROP COLUMN "unique_opens",
ADD COLUMN     "bounceDrops" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeBounceRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeSpamReportsRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeTotalClickRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeTotalOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeUniqueClickRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeUniqueOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cumulativeUnsubscribeRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyBounceRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailySpamReportsRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyTotalClickRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyTotalClickToOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyTotalOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyUniqueClickRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyUniqueClickToOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyUniqueOpenRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyUnsubscribeRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailCampaignId" TEXT NOT NULL,
ADD COLUMN     "emailClientId" TEXT NOT NULL,
ADD COLUMN     "singleSendName" TEXT NOT NULL,
ADD COLUMN     "spamReportDrops" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "spamReports" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalOpens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueOpens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EmailClient" DROP COLUMN "client_name",
ADD COLUMN     "clientName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailClientCredentials" DROP COLUMN "api_key",
DROP COLUMN "email_client_id",
DROP COLUMN "platform_name",
ADD COLUMN     "apiKey" TEXT NOT NULL,
ADD COLUMN     "emailClientId" TEXT NOT NULL,
ADD COLUMN     "platformName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailGlobalDailyStats" DROP COLUMN "email_client_id",
ADD COLUMN     "bounces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailClientId" TEXT NOT NULL,
ADD COLUMN     "opens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unsubs" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_campaignId_key" ON "EmailCampaign"("campaignId");

-- AddForeignKey
ALTER TABLE "EmailCampaignContent" ADD CONSTRAINT "EmailCampaignContent_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_emailClientId_fkey" FOREIGN KEY ("emailClientId") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignDailyStats" ADD CONSTRAINT "EmailCampaignDailyStats_emailClientId_fkey" FOREIGN KEY ("emailClientId") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignDailyStats" ADD CONSTRAINT "EmailCampaignDailyStats_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailClientCredentials" ADD CONSTRAINT "EmailClientCredentials_emailClientId_fkey" FOREIGN KEY ("emailClientId") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailGlobalDailyStats" ADD CONSTRAINT "EmailGlobalDailyStats_emailClientId_fkey" FOREIGN KEY ("emailClientId") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
