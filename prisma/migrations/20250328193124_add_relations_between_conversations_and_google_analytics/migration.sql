-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "description" TEXT,
ADD COLUMN     "gaAccountId" TEXT,
ADD COLUMN     "gaPropertyId" TEXT;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_gaAccountId_fkey" FOREIGN KEY ("gaAccountId") REFERENCES "GaAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
