-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'ERROR', 'PENDING');

-- CreateTable
CREATE TABLE "ClientActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientActivity_userId_idx" ON "ClientActivity"("userId");

-- CreateIndex
CREATE INDEX "ClientActivity_type_idx" ON "ClientActivity"("type");

-- CreateIndex
CREATE INDEX "ClientActivity_createdAt_idx" ON "ClientActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientActivity" ADD CONSTRAINT "ClientActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
