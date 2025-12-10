-- Add SendGrid message id tracking on campaign recipients
ALTER TABLE "CampaignRecipients"
ADD COLUMN "sendgridMessageId" TEXT;

CREATE INDEX "CampaignRecipients_sendgridMessageId_idx"
ON "CampaignRecipients"("sendgridMessageId");
