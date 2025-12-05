-- Remove daily stats tied to campaigns whose names contain "test" (case-insensitive)
DELETE FROM "EmailCampaignDailyStats"
WHERE "emailCampaignId" IN (
  SELECT "campaignId"
  FROM "EmailCampaign"
  WHERE "campaignName" ILIKE '%test%'
);

-- Remove campaign content for the same campaigns to satisfy foreign key constraints
DELETE FROM "EmailCampaignContent"
WHERE "emailCampaignId" IN (
  SELECT "id"
  FROM "EmailCampaign"
  WHERE "campaignName" ILIKE '%test%'
);

-- Remove the campaigns themselves
DELETE FROM "EmailCampaign"
WHERE "campaignName" ILIKE '%test%';
