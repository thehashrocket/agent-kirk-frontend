-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subject" TEXT;
