-- CreateTable
CREATE TABLE "SproutSocialAccount" (
    "id" TEXT NOT NULL,
    "customerProfileId" INTEGER NOT NULL,
    "networkType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "nativeId" TEXT NOT NULL,
    "groups" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SproutSocialAccount_pkey" PRIMARY KEY ("id")
);
