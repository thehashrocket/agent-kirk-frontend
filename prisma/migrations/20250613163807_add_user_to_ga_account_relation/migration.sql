-- CreateTable
CREATE TABLE "UserToGaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gaAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToGaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserToGaAccount_userId_gaAccountId_key" ON "UserToGaAccount"("userId", "gaAccountId");

-- CreateIndex
CREATE INDEX "UserToGaAccount_userId_idx" ON "UserToGaAccount"("userId");

-- CreateIndex
CREATE INDEX "UserToGaAccount_gaAccountId_idx" ON "UserToGaAccount"("gaAccountId");

-- AddForeignKey
ALTER TABLE "UserToGaAccount" ADD CONSTRAINT "UserToGaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToGaAccount" ADD CONSTRAINT "UserToGaAccount_gaAccountId_fkey" FOREIGN KEY ("gaAccountId") REFERENCES "GaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data
DO $$ 
DECLARE
    ga_account RECORD;
BEGIN
    FOR ga_account IN SELECT id, "userId" FROM "GaAccount" WHERE "userId" IS NOT NULL
    LOOP
        INSERT INTO "UserToGaAccount" ("id", "userId", "gaAccountId", "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid()::text,
            ga_account."userId",
            ga_account.id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END LOOP;
END $$; 