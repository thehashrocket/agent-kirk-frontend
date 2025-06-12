-- CreateTable
CREATE TABLE "SproutLinkedInAnalytics" (
    "id" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "reportingDate" DATE NOT NULL,
    "engagements" INTEGER,
    "impressions" INTEGER,
    "impressionsUnique" INTEGER,
    "followersCount" INTEGER,
    "reactions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutLinkedInAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutLinkedInAnalytics_sproutSocialAccountId_idx" ON "SproutLinkedInAnalytics"("sproutSocialAccountId");

-- AddForeignKey
ALTER TABLE "SproutLinkedInAnalytics" ADD CONSTRAINT "SproutLinkedInAnalytics_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
