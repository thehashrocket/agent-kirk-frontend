-- CreateTable
CREATE TABLE "SproutInstagramAnalytics" (
    "id" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "reportingDate" DATE NOT NULL,
    "commentsCount" INTEGER,
    "engagements" INTEGER,
    "impressions" INTEGER,
    "impressionsUnique" INTEGER,
    "followersCount" INTEGER,
    "likes" INTEGER,
    "saves" INTEGER,
    "videoViews" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutInstagramAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SproutInstagramFollowersByCity" (
    "id" TEXT NOT NULL,
    "sproutInstagramAnalyticsId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutInstagramFollowersByCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SproutInstagramFollowersByCountry" (
    "id" TEXT NOT NULL,
    "sproutInstagramAnalyticsId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutInstagramFollowersByCountry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutInstagramAnalytics_sproutSocialAccountId_idx" ON "SproutInstagramAnalytics"("sproutSocialAccountId");

-- CreateIndex
CREATE INDEX "SproutInstagramFollowersByCity_sproutInstagramAnalyticsId_idx" ON "SproutInstagramFollowersByCity"("sproutInstagramAnalyticsId");

-- CreateIndex
CREATE INDEX "SproutInstagramFollowersByCountry_sproutInstagramAnalyticsI_idx" ON "SproutInstagramFollowersByCountry"("sproutInstagramAnalyticsId");

-- AddForeignKey
ALTER TABLE "SproutInstagramAnalytics" ADD CONSTRAINT "SproutInstagramAnalytics_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SproutInstagramFollowersByCity" ADD CONSTRAINT "SproutInstagramFollowersByCity_sproutInstagramAnalyticsId_fkey" FOREIGN KEY ("sproutInstagramAnalyticsId") REFERENCES "SproutInstagramAnalytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SproutInstagramFollowersByCountry" ADD CONSTRAINT "SproutInstagramFollowersByCountry_sproutInstagramAnalytics_fkey" FOREIGN KEY ("sproutInstagramAnalyticsId") REFERENCES "SproutInstagramAnalytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
