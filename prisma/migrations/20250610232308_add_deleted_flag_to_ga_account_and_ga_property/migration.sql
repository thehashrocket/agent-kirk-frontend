-- AlterTable
ALTER TABLE "GaAccount" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GaProperty" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
