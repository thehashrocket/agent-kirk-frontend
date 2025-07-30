-- CreateTable
CREATE TABLE "public"."Log" (
    "id" TEXT NOT NULL,
    "eventMessage" TEXT,
    "eventType" TEXT,
    "errorMessage" TEXT,
    "errorStackTrace" TEXT,
    "message" TEXT,
    "metrics" JSONB,
    "nodeName" TEXT,
    "payload" JSONB,
    "queryId" TEXT,
    "sourceReferences" JSONB,
    "userId" TEXT,
    "workflowName" TEXT,
    "environment" TEXT,
    "serviceName" TEXT,
    "version" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "duration" INTEGER,
    "memoryUsage" INTEGER,
    "cpuUsage" DOUBLE PRECISION,
    "severity" TEXT,
    "isAuthenticated" BOOLEAN,
    "permissions" JSONB,
    "modelName" TEXT,
    "tokenUsage" JSONB,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "clientId" TEXT,
    "pageUrl" TEXT,
    "componentName" TEXT,
    "errorCode" TEXT,
    "errorCategory" TEXT,
    "retryCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Log_userId_idx" ON "public"."Log"("userId");

-- CreateIndex
CREATE INDEX "Log_queryId_idx" ON "public"."Log"("queryId");

-- CreateIndex
CREATE INDEX "Log_createdAt_idx" ON "public"."Log"("createdAt");

-- CreateIndex
CREATE INDEX "Log_environment_idx" ON "public"."Log"("environment");

-- CreateIndex
CREATE INDEX "Log_serviceName_idx" ON "public"."Log"("serviceName");

-- CreateIndex
CREATE INDEX "Log_severity_idx" ON "public"."Log"("severity");

-- CreateIndex
CREATE INDEX "Log_requestId_idx" ON "public"."Log"("requestId");

-- CreateIndex
CREATE INDEX "Log_clientId_idx" ON "public"."Log"("clientId");

-- CreateIndex
CREATE INDEX "Log_errorCode_idx" ON "public"."Log"("errorCode");

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "public"."Query"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
