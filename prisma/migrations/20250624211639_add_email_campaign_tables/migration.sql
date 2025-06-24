-- AlterTable
ALTER TABLE "SproutFacebookAnalytics" ALTER COLUMN "engagements" SET DEFAULT 0,
ALTER COLUMN "impressions" SET DEFAULT 0,
ALTER COLUMN "impressionsUnique" SET DEFAULT 0,
ALTER COLUMN "followersCount" SET DEFAULT 0,
ALTER COLUMN "postContentClicks" SET DEFAULT 0,
ALTER COLUMN "postContentClicksOther" SET DEFAULT 0,
ALTER COLUMN "postLinkClicks" SET DEFAULT 0,
ALTER COLUMN "postPhotoViewClicks" SET DEFAULT 0,
ALTER COLUMN "tabViews" SET DEFAULT 0,
ALTER COLUMN "videoViews" SET DEFAULT 0,
ALTER COLUMN "videoViews10s" SET DEFAULT 0,
ALTER COLUMN "videoViewsOrganic" SET DEFAULT 0,
ALTER COLUMN "videoViewsPaid" SET DEFAULT 0,
ALTER COLUMN "videoViewsUnique" SET DEFAULT 0,
ALTER COLUMN "netFollowerGrowth" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutFacebookPostAnalytics" ALTER COLUMN "angryReactions" SET DEFAULT 0,
ALTER COLUMN "commentsCount" SET DEFAULT 0,
ALTER COLUMN "hahaReactions" SET DEFAULT 0,
ALTER COLUMN "impressions" SET DEFAULT 0,
ALTER COLUMN "impressionsFollower" SET DEFAULT 0,
ALTER COLUMN "impressionsNonFollower" SET DEFAULT 0,
ALTER COLUMN "impressionsNonViral" SET DEFAULT 0,
ALTER COLUMN "impressionsOrganic" SET DEFAULT 0,
ALTER COLUMN "impressionsPaid" SET DEFAULT 0,
ALTER COLUMN "impressionsViral" SET DEFAULT 0,
ALTER COLUMN "likes" SET DEFAULT 0,
ALTER COLUMN "loveReactions" SET DEFAULT 0,
ALTER COLUMN "postContentClicks" SET DEFAULT 0,
ALTER COLUMN "postContentClicksOther" SET DEFAULT 0,
ALTER COLUMN "postLinkClicks" SET DEFAULT 0,
ALTER COLUMN "postPhotoViewClicks" SET DEFAULT 0,
ALTER COLUMN "postVideoPlayClicks" SET DEFAULT 0,
ALTER COLUMN "questionAnswers" SET DEFAULT 0,
ALTER COLUMN "reach" SET DEFAULT 0,
ALTER COLUMN "reachFollower" SET DEFAULT 0,
ALTER COLUMN "reachNonViral" SET DEFAULT 0,
ALTER COLUMN "reachOrganic" SET DEFAULT 0,
ALTER COLUMN "reachPaid" SET DEFAULT 0,
ALTER COLUMN "reachViral" SET DEFAULT 0,
ALTER COLUMN "reactions" SET DEFAULT 0,
ALTER COLUMN "sadReactions" SET DEFAULT 0,
ALTER COLUMN "sharesCount" SET DEFAULT 0,
ALTER COLUMN "videoLength" SET DEFAULT 0,
ALTER COLUMN "videoViews" SET DEFAULT 0,
ALTER COLUMN "videoViewsAutoplay" SET DEFAULT 0,
ALTER COLUMN "videoViewsOrganic" SET DEFAULT 0,
ALTER COLUMN "videoViewsPaid" SET DEFAULT 0,
ALTER COLUMN "wowReactions" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutInstagramAnalytics" ALTER COLUMN "commentsCount" SET DEFAULT 0,
ALTER COLUMN "engagements" SET DEFAULT 0,
ALTER COLUMN "impressions" SET DEFAULT 0,
ALTER COLUMN "impressionsUnique" SET DEFAULT 0,
ALTER COLUMN "followersCount" SET DEFAULT 0,
ALTER COLUMN "likes" SET DEFAULT 0,
ALTER COLUMN "saves" SET DEFAULT 0,
ALTER COLUMN "videoViews" SET DEFAULT 0,
ALTER COLUMN "emailContacts" SET DEFAULT 0,
ALTER COLUMN "getDirectionsClicks" SET DEFAULT 0,
ALTER COLUMN "phoneCallClicks" SET DEFAULT 0,
ALTER COLUMN "postsSentCount" SET DEFAULT 0,
ALTER COLUMN "profileFollowerAdds" SET DEFAULT 0,
ALTER COLUMN "profileFollowers" SET DEFAULT 0,
ALTER COLUMN "profileImpressionsUnique" SET DEFAULT 0,
ALTER COLUMN "profileReachUnique" SET DEFAULT 0,
ALTER COLUMN "profileViews" SET DEFAULT 0,
ALTER COLUMN "profileViewsUnique" SET DEFAULT 0,
ALTER COLUMN "websiteClicks" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutInstagramFollowersByCity" ALTER COLUMN "count" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutInstagramFollowersByCountry" ALTER COLUMN "count" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutLinkedInAnalytics" ALTER COLUMN "engagements" SET DEFAULT 0,
ALTER COLUMN "impressions" SET DEFAULT 0,
ALTER COLUMN "impressionsUnique" SET DEFAULT 0,
ALTER COLUMN "followersCount" SET DEFAULT 0,
ALTER COLUMN "reactions" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SproutPinterestAnalytics" ALTER COLUMN "followersCount" SET DEFAULT 0,
ALTER COLUMN "followingCount" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "EmailCampaignContent" (
    "id" TEXT NOT NULL,
    "email_campaign_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "plain_content" TEXT NOT NULL,
    "web_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "create_time" TIMESTAMP(3) NOT NULL,
    "send_time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaignContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "email_client_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignDailyStats" (
    "id" TEXT NOT NULL,
    "email_campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "email_client_id" TEXT NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "bounces" INTEGER NOT NULL DEFAULT 0,
    "unsubscribes" INTEGER NOT NULL DEFAULT 0,
    "total_opens" INTEGER NOT NULL DEFAULT 0,
    "daily_total_open_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_total_open_rate" INTEGER NOT NULL DEFAULT 0,
    "unique_opens" INTEGER NOT NULL DEFAULT 0,
    "daily_unique_open_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_unique_open_rate" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "daily_total_click_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_total_click_rate" INTEGER NOT NULL DEFAULT 0,
    "unique_clicks" INTEGER NOT NULL DEFAULT 0,
    "daily_unique_click_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_unique_click_rate" INTEGER NOT NULL DEFAULT 0,
    "daily_unique_click_to_open_rate" INTEGER NOT NULL DEFAULT 0,
    "daily_total_click_to_open_rate" INTEGER NOT NULL DEFAULT 0,
    "spam_reports" INTEGER NOT NULL DEFAULT 0,
    "daily_spam_reports_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_spam_reports_rate" INTEGER NOT NULL DEFAULT 0,
    "spam_report_drops" INTEGER NOT NULL DEFAULT 0,
    "daily_unsubscribe_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_unsubscribe_rate" INTEGER NOT NULL DEFAULT 0,
    "single_send_name" TEXT NOT NULL,
    "variation" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "daily_bounce_rate" INTEGER NOT NULL DEFAULT 0,
    "cumulative_bounce_rate" INTEGER NOT NULL DEFAULT 0,
    "bounce_drops" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaignDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailClient" (
    "id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailClientCredentials" (
    "id" TEXT NOT NULL,
    "email_client_id" TEXT NOT NULL,
    "platform_name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailClientCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailGlobalDailyStats" (
    "id" TEXT NOT NULL,
    "email_client_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailGlobalDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_campaign_id_key" ON "EmailCampaign"("campaign_id");

-- AddForeignKey
ALTER TABLE "EmailCampaignContent" ADD CONSTRAINT "EmailCampaignContent_email_campaign_id_fkey" FOREIGN KEY ("email_campaign_id") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_email_client_id_fkey" FOREIGN KEY ("email_client_id") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignDailyStats" ADD CONSTRAINT "EmailCampaignDailyStats_email_client_id_fkey" FOREIGN KEY ("email_client_id") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignDailyStats" ADD CONSTRAINT "EmailCampaignDailyStats_email_campaign_id_fkey" FOREIGN KEY ("email_campaign_id") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailClientCredentials" ADD CONSTRAINT "EmailClientCredentials_email_client_id_fkey" FOREIGN KEY ("email_client_id") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailGlobalDailyStats" ADD CONSTRAINT "EmailGlobalDailyStats_email_client_id_fkey" FOREIGN KEY ("email_client_id") REFERENCES "EmailClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
