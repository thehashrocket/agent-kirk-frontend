-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "apiCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "apiCreditsLimit" INTEGER NOT NULL DEFAULT 10000;

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");
