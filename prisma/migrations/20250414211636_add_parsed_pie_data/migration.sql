-- CreateTable
CREATE TABLE "ParsedPieGraphData" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL,
    "bounces" INTEGER NOT NULL,
    "prevSessionsDiff" DOUBLE PRECISION NOT NULL,
    "prevConversionRateDiff" DOUBLE PRECISION NOT NULL,
    "prevConversionsDiff" DOUBLE PRECISION NOT NULL,
    "prevBouncesDiff" DOUBLE PRECISION NOT NULL,
    "yearSessionsDiff" DOUBLE PRECISION NOT NULL,
    "yearConversionRateDiff" DOUBLE PRECISION NOT NULL,
    "yearConversionsDiff" DOUBLE PRECISION NOT NULL,
    "yearBouncesDiff" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParsedPieGraphData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ParsedPieGraphData" ADD CONSTRAINT "ParsedPieGraphData_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
