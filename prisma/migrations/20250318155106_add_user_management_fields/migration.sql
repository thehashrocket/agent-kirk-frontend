-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountRepId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountRepId_fkey" FOREIGN KEY ("accountRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
