// src/components/channels/paid-social/types.ts

export interface PaidSocialMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  linkClicks: number;
  linkCtr: number;
  costPerLinkClick: number;
  lpvs: number;
  costPerLpv: number;
  amountSpent: number;
}

export interface PaidSocialEngagement {
  id: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  reach: number;
  impressions: number;
  engagement: number;
  linkClicks: number;
  linkCtr: number;
  costPerLinkClick: number;
  lpvs: number;
  costPerLpv: number;
  amountSpent: number;
}

export interface PaidSocialCampaignOverview {
  id: string;
  campaign: string;
  source: string;
  adContent: string;
  users: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: string;
}

export interface PaidSocialChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: PaidSocialMetrics;
  engagementData: PaidSocialEngagement[];
  campaignOverview: PaidSocialCampaignOverview[];
}

// Props interfaces for components
export interface PaidSocialMetricsOverviewProps {
  metrics?: PaidSocialMetrics;
  isLoading?: boolean;
}

export interface PaidSocialEngagementTableProps {
  engagementData: PaidSocialEngagement[];
  isLoading?: boolean;
}

export interface PaidSocialCampaignOverviewProps {
  campaignOverview: PaidSocialCampaignOverview[];
  isLoading?: boolean;
}

export interface PaidSocialDashboardProps {
  data?: PaidSocialChannelData;
  isLoading?: boolean;
  error?: string;
} 