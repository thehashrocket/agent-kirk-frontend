-- CreateTable
CREATE TABLE "SproutFacebookPost" (
    "id" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "postType" TEXT NOT NULL,
    "postStatus" TEXT NOT NULL,
    "postLink" TEXT NOT NULL,
    "postText" TEXT NOT NULL,
    "postNativeId" TEXT NOT NULL,
    "postCreatedTime" TIMESTAMP(3) NOT NULL,
    "postSentTime" TIMESTAMP(3) NOT NULL,
    "postLastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutFacebookPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SproutFacebookPost_sproutSocialAccountId_idx" ON "SproutFacebookPost"("sproutSocialAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SproutFacebookPost_sproutSocialAccountId_postNativeId_key" ON "SproutFacebookPost"("sproutSocialAccountId", "postNativeId");

-- AddForeignKey
ALTER TABLE "SproutFacebookPost" ADD CONSTRAINT "SproutFacebookPost_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
