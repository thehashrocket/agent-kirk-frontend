-- CreateTable
CREATE TABLE "ParsedQueryData" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL,
    "bounces" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParsedQueryData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParsedQueryData" ADD CONSTRAINT "ParsedQueryData_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
