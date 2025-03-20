-- CreateTable
CREATE TABLE "ClientSatisfaction" (
    "id" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "feedback" TEXT,
    "userId" TEXT NOT NULL,
    "accountRepId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSatisfaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientSatisfaction_userId_idx" ON "ClientSatisfaction"("userId");

-- CreateIndex
CREATE INDEX "ClientSatisfaction_accountRepId_idx" ON "ClientSatisfaction"("accountRepId");

-- CreateIndex
CREATE INDEX "ClientSatisfaction_createdAt_idx" ON "ClientSatisfaction"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientSatisfaction" ADD CONSTRAINT "ClientSatisfaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSatisfaction" ADD CONSTRAINT "ClientSatisfaction_accountRepId_fkey" FOREIGN KEY ("accountRepId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
