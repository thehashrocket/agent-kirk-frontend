-- CreateTable
CREATE TABLE "GaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gaAccountId" TEXT NOT NULL,

    CONSTRAINT "GaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaProperty" (
    "id" TEXT NOT NULL,
    "gaPropertyId" TEXT NOT NULL,

    CONSTRAINT "GaProperty_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GaAccount" ADD CONSTRAINT "GaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaProperty" ADD CONSTRAINT "GaProperty_gaPropertyId_fkey" FOREIGN KEY ("gaPropertyId") REFERENCES "GaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
