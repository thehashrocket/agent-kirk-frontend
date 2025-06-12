-- CreateTable
CREATE TABLE "SproutFacebookAnalytics" (
    "id" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "reportingDate" DATE NOT NULL,
    "engagements" INTEGER,
    "impressions" INTEGER,
    "impressionsUnique" INTEGER,
    "followersCount" INTEGER,
    "postContentClicks" INTEGER,
    "postContentClicksOther" INTEGER,
    "postLinkClicks" INTEGER,
    "postPhotoViewClicks" INTEGER,
    "tabViews" INTEGER,
    "videoViews" INTEGER,
    "videoViews10s" INTEGER,
    "videoViewsOrganic" INTEGER,
    "videoViewsPaid" INTEGER,
    "videoViewsUnique" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutFacebookAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutFacebookAnalytics_sproutSocialAccountId_idx" ON "SproutFacebookAnalytics"("sproutSocialAccountId");

-- AddForeignKey
ALTER TABLE "SproutFacebookAnalytics" ADD CONSTRAINT "SproutFacebookAnalytics_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
