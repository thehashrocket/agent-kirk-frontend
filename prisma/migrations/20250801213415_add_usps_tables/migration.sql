-- CreateTable
CREATE TABLE "public"."UserToUspsClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uspsClientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToUspsClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UspsCampaign" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "sendDate" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "uspsClientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UspsCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UspsCampaignSummary" (
    "id" TEXT NOT NULL,
    "finalScanCount" INTEGER NOT NULL,
    "mailDate" DATE NOT NULL,
    "numberDelivered" INTEGER NOT NULL,
    "percentDelivered" DOUBLE PRECISION NOT NULL,
    "percentFinalScan" DOUBLE PRECISION NOT NULL,
    "percentOnTime" DOUBLE PRECISION NOT NULL,
    "percentScanned" DOUBLE PRECISION NOT NULL,
    "pieces" INTEGER NOT NULL,
    "reportId" TEXT NOT NULL,
    "scanDate" DATE NOT NULL,
    "totalScanned" INTEGER NOT NULL,
    "uspsCampaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UspsCampaignSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UspsCampaignZipStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scans" INTEGER NOT NULL,
    "uspsCampaignId" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UspsCampaignZipStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UspsClient" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UspsClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserToUspsClient_userId_idx" ON "public"."UserToUspsClient"("userId");

-- CreateIndex
CREATE INDEX "UserToUspsClient_uspsClientId_idx" ON "public"."UserToUspsClient"("uspsClientId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToUspsClient_userId_uspsClientId_key" ON "public"."UserToUspsClient"("userId", "uspsClientId");

-- CreateIndex
CREATE INDEX "UspsCampaign_campaignName_idx" ON "public"."UspsCampaign"("campaignName");

-- CreateIndex
CREATE INDEX "UspsCampaignSummary_scanDate_mailDate_uspsCampaignId_report_idx" ON "public"."UspsCampaignSummary"("scanDate", "mailDate", "uspsCampaignId", "reportId");

-- CreateIndex
CREATE INDEX "UspsCampaignZipStats_uspsCampaignId_idx" ON "public"."UspsCampaignZipStats"("uspsCampaignId");

-- AddForeignKey
ALTER TABLE "public"."UserToUspsClient" ADD CONSTRAINT "UserToUspsClient_uspsClientId_fkey" FOREIGN KEY ("uspsClientId") REFERENCES "public"."UspsClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserToUspsClient" ADD CONSTRAINT "UserToUspsClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UspsCampaign" ADD CONSTRAINT "UspsCampaign_uspsClientId_fkey" FOREIGN KEY ("uspsClientId") REFERENCES "public"."UspsClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UspsCampaignSummary" ADD CONSTRAINT "UspsCampaignSummary_uspsCampaignId_fkey" FOREIGN KEY ("uspsCampaignId") REFERENCES "public"."UspsCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UspsCampaignZipStats" ADD CONSTRAINT "UspsCampaignZipStats_uspsCampaignId_fkey" FOREIGN KEY ("uspsCampaignId") REFERENCES "public"."UspsCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
