-- AlterTable
ALTER TABLE "public"."GaChannelDaily" ADD COLUMN     "newUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "users" INTEGER NOT NULL DEFAULT 0;
