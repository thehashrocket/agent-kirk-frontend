-- CreateTable
CREATE TABLE "SproutPinterestAnalytics" (
    "id" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "reportingDate" DATE NOT NULL,
    "followersCount" INTEGER,
    "followingCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutPinterestAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutPinterestAnalytics_sproutSocialAccountId_idx" ON "SproutPinterestAnalytics"("sproutSocialAccountId");

-- AddForeignKey
ALTER TABLE "SproutPinterestAnalytics" ADD CONSTRAINT "SproutPinterestAnalytics_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
