-- CreateTable
CREATE TABLE "CampaignRecipients" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "address_1" TEXT,
    "address_2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "sector" TEXT,
    "market" TEXT,
    "addressId" TEXT,
    "coreSegment" TEXT,
    "subSegment" TEXT,
    "emailCampaignId" TEXT,
    "uspsCampaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRecipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignRecipients_emailCampaignId_idx" ON "CampaignRecipients"("emailCampaignId");

-- CreateIndex
CREATE INDEX "CampaignRecipients_uspsCampaignId_idx" ON "CampaignRecipients"("uspsCampaignId");

-- AddForeignKey
ALTER TABLE "CampaignRecipients" ADD CONSTRAINT "CampaignRecipients_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipients" ADD CONSTRAINT "CampaignRecipients_uspsCampaignId_fkey" FOREIGN KEY ("uspsCampaignId") REFERENCES "UspsCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
