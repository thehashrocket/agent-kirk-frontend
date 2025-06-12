-- CreateTable
CREATE TABLE "UserToSproutSocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sproutSocialAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToSproutSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserToSproutSocialAccount_userId_idx" ON "UserToSproutSocialAccount"("userId");

-- CreateIndex
CREATE INDEX "UserToSproutSocialAccount_sproutSocialAccountId_idx" ON "UserToSproutSocialAccount"("sproutSocialAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToSproutSocialAccount_userId_sproutSocialAccountId_key" ON "UserToSproutSocialAccount"("userId", "sproutSocialAccountId");

-- AddForeignKey
ALTER TABLE "UserToSproutSocialAccount" ADD CONSTRAINT "UserToSproutSocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToSproutSocialAccount" ADD CONSTRAINT "UserToSproutSocialAccount_sproutSocialAccountId_fkey" FOREIGN KEY ("sproutSocialAccountId") REFERENCES "SproutSocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
