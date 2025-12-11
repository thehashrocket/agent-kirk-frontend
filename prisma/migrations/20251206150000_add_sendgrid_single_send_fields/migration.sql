-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "abTest" JSONB,
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN     "isAbTest" BOOLEAN DEFAULT false,
ADD COLUMN     "sendAt" TIMESTAMP(3),
ADD COLUMN     "singleSendCreatedAt" TIMESTAMP(3),
ADD COLUMN     "singleSendUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT;
