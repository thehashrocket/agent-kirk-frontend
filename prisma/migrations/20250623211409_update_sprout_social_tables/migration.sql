-- AlterTable
ALTER TABLE "SproutFacebookAnalytics" ADD COLUMN     "netFollowerGrowth" INTEGER;

-- AlterTable
ALTER TABLE "SproutInstagramAnalytics" ADD COLUMN     "emailContacts" INTEGER,
ADD COLUMN     "getDirectionsClicks" INTEGER,
ADD COLUMN     "phoneCallClicks" INTEGER,
ADD COLUMN     "postsSendByContentType" JSONB,
ADD COLUMN     "postsSentByPostType" JSONB,
ADD COLUMN     "postsSentCount" INTEGER,
ADD COLUMN     "profileFollowerAdds" INTEGER,
ADD COLUMN     "profileFollowers" INTEGER,
ADD COLUMN     "profileImpressionsUnique" INTEGER,
ADD COLUMN     "profileReachUnique" INTEGER,
ADD COLUMN     "profileViews" INTEGER,
ADD COLUMN     "profileViewsUnique" INTEGER,
ADD COLUMN     "websiteClicks" INTEGER;

-- CreateTable
CREATE TABLE "SproutFacebookPostAnalytics" (
    "id" TEXT NOT NULL,
    "angryReactions" INTEGER,
    "clientNativeId" TEXT NOT NULL,
    "commentsCount" INTEGER,
    "hahaReactions" INTEGER,
    "impressions" INTEGER,
    "impressionsFollower" INTEGER,
    "impressionsNonFollower" INTEGER,
    "impressionsNonViral" INTEGER,
    "impressionsOrganic" INTEGER,
    "impressionsPaid" INTEGER,
    "impressionsViral" INTEGER,
    "likes" INTEGER,
    "loveReactions" INTEGER,
    "postContentClicks" INTEGER,
    "postContentClicksOther" INTEGER,
    "postLinkClicks" INTEGER,
    "postNativeId" TEXT NOT NULL,
    "postPhotoViewClicks" INTEGER,
    "postVideoPlayClicks" INTEGER,
    "questionAnswers" INTEGER,
    "reach" INTEGER,
    "reachFollower" INTEGER,
    "reachNonViral" INTEGER,
    "reachOrganic" INTEGER,
    "reachPaid" INTEGER,
    "reachViral" INTEGER,
    "reactions" INTEGER,
    "reportingDate" DATE NOT NULL,
    "sadReactions" INTEGER,
    "sharesCount" INTEGER,
    "sproutSocialAccountId" TEXT NOT NULL,
    "videoLength" INTEGER,
    "videoViews" INTEGER,
    "videoViewsAutoplay" INTEGER,
    "videoViewsOrganic" INTEGER,
    "videoViewsPaid" INTEGER,
    "wowReactions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutFacebookPostAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutFacebookPostAnalytics_sproutSocialAccountId_idx" ON "SproutFacebookPostAnalytics"("sproutSocialAccountId");

-- AddForeignKey
ALTER TABLE "SproutFacebookPostAnalytics" ADD CONSTRAINT "SproutFacebookPostAnalytics_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
