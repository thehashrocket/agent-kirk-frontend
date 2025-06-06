// src/components/channels/paid-search/types.ts

export interface PaidSearchMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
  phoneCalls: number;
  totalSpend: number;
}

export interface PaidSearchCampaignOverview {
  year: number;
  period: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
  phoneCalls: number;
  totalSpend: number;
}

export interface PaidSearchCampaign {
  id: string;
  name: string;
  clicks: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
  phoneCalls: number;
  costPerConversion: number;
}

export interface PaidSearchPerformanceData {
  date: string;
  campaign: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface FacebookCampaign {
  id: string;
  name: string;
  amountSpent: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
}

export interface FacebookCampaignsOverview {
  year: number;
  campaigns: FacebookCampaign[];
  totalSpent: number;
  totalLinkClicks: number;
  avgCtr: number;
  avgCpc: number;
}

export interface PaidSearchChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  campaignOverview: PaidSearchCampaignOverview[];
  allCampaigns: PaidSearchCampaign[];
  performanceData: PaidSearchPerformanceData[];
  facebookCampaigns: FacebookCampaignsOverview[];
}

// Props interfaces for components
export interface PaidSearchMetricsOverviewProps {
  campaignOverview: PaidSearchCampaignOverview[];
  isLoading?: boolean;
}

export interface PaidSearchCampaignsTableProps {
  campaigns: PaidSearchCampaign[];
  isLoading?: boolean;
}

export interface PaidSearchPerformanceChartProps {
  data: PaidSearchPerformanceData[];
  isLoading?: boolean;
}

export interface PaidSearchFacebookCampaignsProps {
  facebookCampaigns: FacebookCampaignsOverview[];
  isLoading?: boolean;
}

export interface PaidSearchDashboardProps {
  data?: PaidSearchChannelData;
  isLoading?: boolean;
  error?: string;
} 