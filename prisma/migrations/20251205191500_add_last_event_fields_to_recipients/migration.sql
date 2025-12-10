-- Track the last SendGrid event on recipients
ALTER TABLE "CampaignRecipients"
ADD COLUMN "lastEventType" TEXT,
ADD COLUMN "lastEventDetail" TEXT;
