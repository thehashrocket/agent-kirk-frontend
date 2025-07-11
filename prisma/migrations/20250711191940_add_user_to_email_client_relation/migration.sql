-- CreateTable
CREATE TABLE "UserToEmailClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailClientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToEmailClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserToEmailClient_userId_idx" ON "UserToEmailClient"("userId");

-- CreateIndex
CREATE INDEX "UserToEmailClient_emailClientId_idx" ON "UserToEmailClient"("emailClientId");

-- CreateIndex
CREATE UNIQUE INDEX "UserToEmailClient_userId_emailClientId_key" ON "UserToEmailClient"("userId", "emailClientId");

-- AddForeignKey
ALTER TABLE "UserToEmailClient" ADD CONSTRAINT "UserToEmailClient_emailClientId_fkey" FOREIGN KEY ("emailClientId") REFERENCES "EmailClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToEmailClient" ADD CONSTRAINT "UserToEmailClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
