/*
  Warnings:

  - You are about to drop the `LLMRequest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Query` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LLMRequest" DROP CONSTRAINT "LLMRequest_userId_fkey";

-- AlterTable
ALTER TABLE "Query" ADD COLUMN     "accountGA4" TEXT,
ADD COLUMN     "conversationID" TEXT,
ADD COLUMN     "dateToday" TIMESTAMP(3),
ADD COLUMN     "propertyGA4" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "LLMRequest";

-- CreateIndex
CREATE INDEX "Query_conversationID_idx" ON "Query"("conversationID");
