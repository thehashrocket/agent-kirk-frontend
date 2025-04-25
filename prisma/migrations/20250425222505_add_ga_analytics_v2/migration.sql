-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('queued', 'ok', 'error');

-- CreateTable
CREATE TABLE "GaImportRun" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GaImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaKpiDaily" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessions" INTEGER NOT NULL,
    "screenPageViewsPerSession" DOUBLE PRECISION NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDurationSec" INTEGER NOT NULL,
    "goalCompletions" INTEGER NOT NULL,
    "goalCompletionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaKpiDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaKpiMonthly" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "sessions" INTEGER NOT NULL,
    "screenPageViewsPerSession" DOUBLE PRECISION NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDurationSec" INTEGER NOT NULL,
    "goalCompletions" INTEGER NOT NULL,
    "goalCompletionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaKpiMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaChannelDaily" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channelGroup" VARCHAR(64) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "screenPageViewsPerSession" DOUBLE PRECISION NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDurationSec" INTEGER NOT NULL,
    "goalCompletions" INTEGER NOT NULL,
    "goalCompletionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaChannelDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaSourceDaily" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "trafficSource" VARCHAR(64) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "screenPageViewsPerSession" DOUBLE PRECISION NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "avgSessionDurationSec" INTEGER NOT NULL,
    "goalCompletions" INTEGER NOT NULL,
    "goalCompletionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaSourceDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GaKpiDaily_date_idx" ON "GaKpiDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "GaKpiDaily_gaPropertyId_date_key" ON "GaKpiDaily"("gaPropertyId", "date");

-- CreateIndex
CREATE INDEX "GaKpiMonthly_month_idx" ON "GaKpiMonthly"("month");

-- CreateIndex
CREATE UNIQUE INDEX "GaKpiMonthly_gaPropertyId_month_key" ON "GaKpiMonthly"("gaPropertyId", "month");

-- CreateIndex
CREATE INDEX "GaChannelDaily_date_idx" ON "GaChannelDaily"("date");

-- CreateIndex
CREATE INDEX "GaChannelDaily_channelGroup_idx" ON "GaChannelDaily"("channelGroup");

-- CreateIndex
CREATE UNIQUE INDEX "GaChannelDaily_gaPropertyId_date_channelGroup_key" ON "GaChannelDaily"("gaPropertyId", "date", "channelGroup");

-- CreateIndex
CREATE INDEX "GaSourceDaily_date_idx" ON "GaSourceDaily"("date");

-- CreateIndex
CREATE INDEX "GaSourceDaily_trafficSource_idx" ON "GaSourceDaily"("trafficSource");

-- CreateIndex
CREATE UNIQUE INDEX "GaSourceDaily_gaPropertyId_date_trafficSource_key" ON "GaSourceDaily"("gaPropertyId", "date", "trafficSource");

-- AddForeignKey
ALTER TABLE "GaImportRun" ADD CONSTRAINT "GaImportRun_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaImportRun" ADD CONSTRAINT "GaImportRun_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaKpiDaily" ADD CONSTRAINT "GaKpiDaily_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaKpiMonthly" ADD CONSTRAINT "GaKpiMonthly_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaChannelDaily" ADD CONSTRAINT "GaChannelDaily_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaSourceDaily" ADD CONSTRAINT "GaSourceDaily_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
