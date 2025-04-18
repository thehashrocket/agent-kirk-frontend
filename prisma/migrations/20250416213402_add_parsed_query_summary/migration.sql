-- CreateTable
CREATE TABLE "ParsedQuerySummary" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalEngagedSessions" INTEGER NOT NULL,
    "averageBounceRate" DOUBLE PRECISION NOT NULL,
    "totalNewUsers" INTEGER NOT NULL,
    "totalConversions" INTEGER NOT NULL,

    CONSTRAINT "ParsedQuerySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParsedQuerySummary_queryId_date_idx" ON "ParsedQuerySummary"("queryId", "date");

-- AddForeignKey
ALTER TABLE "ParsedQuerySummary" ADD CONSTRAINT "ParsedQuerySummary_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE CASCADE ON UPDATE CASCADE;
