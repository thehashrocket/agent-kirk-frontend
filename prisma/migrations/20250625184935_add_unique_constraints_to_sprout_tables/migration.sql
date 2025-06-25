/*
  Warnings:

  - A unique constraint covering the columns `[customerProfileId,reportingDate]` on the table `SproutFacebookAnalytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[postNativeId,reportingDate]` on the table `SproutFacebookPostAnalytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerProfileId,reportingDate]` on the table `SproutInstagramAnalytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sproutInstagramAnalyticsId,city]` on the table `SproutInstagramFollowersByCity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sproutInstagramAnalyticsId,country]` on the table `SproutInstagramFollowersByCountry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerProfileId,reportingDate]` on the table `SproutLinkedInAnalytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerProfileId]` on the table `SproutSocialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SproutFacebookAnalytics_customerProfileId_reportingDate_key" ON "SproutFacebookAnalytics"("customerProfileId", "reportingDate");

-- CreateIndex
CREATE UNIQUE INDEX "SproutFacebookPostAnalytics_postNativeId_reportingDate_key" ON "SproutFacebookPostAnalytics"("postNativeId", "reportingDate");

-- CreateIndex
CREATE UNIQUE INDEX "SproutInstagramAnalytics_customerProfileId_reportingDate_key" ON "SproutInstagramAnalytics"("customerProfileId", "reportingDate");

-- CreateIndex
CREATE UNIQUE INDEX "SproutInstagramFollowersByCity_sproutInstagramAnalyticsId_c_key" ON "SproutInstagramFollowersByCity"("sproutInstagramAnalyticsId", "city");

-- CreateIndex
CREATE UNIQUE INDEX "SproutInstagramFollowersByCountry_sproutInstagramAnalyticsI_key" ON "SproutInstagramFollowersByCountry"("sproutInstagramAnalyticsId", "country");

-- CreateIndex
CREATE UNIQUE INDEX "SproutLinkedInAnalytics_customerProfileId_reportingDate_key" ON "SproutLinkedInAnalytics"("customerProfileId", "reportingDate");

-- CreateIndex
CREATE UNIQUE INDEX "SproutSocialAccount_customerProfileId_key" ON "SproutSocialAccount"("customerProfileId");
