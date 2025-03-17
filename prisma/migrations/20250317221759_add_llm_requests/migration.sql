-- CreateTable
CREATE TABLE "LLMRequest" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT,
    "accountGA4" TEXT NOT NULL,
    "propertyGA4" TEXT NOT NULL,
    "conversationID" TEXT NOT NULL,
    "dateToday" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LLMRequest" ADD CONSTRAINT "LLMRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
