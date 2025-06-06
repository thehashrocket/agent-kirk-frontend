export interface EmailMetrics {
  totalDeliveries: number;
  uniqueOpens: number;
  avgOpenRate: number;
  uniqueClicks: number;
  avgCTR: number;
  totalUnsubscribes: number;
  totalBounces: number;
}

export interface EmailCampaignActivity {
  id: string;
  delivered: string;
  weekDay: string;
  subject: string;
  link: string;
  successfulDeliveries: number;
  opens: number;
  openRate: number;
  clicks: number;
  ctr: number;
  unsubscribes: number;
  bounces: number;
}

export interface EmailWebsiteActivity {
  id: string;
  campaign: string;
  source: string;
  medium: string;
  adContent: string;
  users: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: string;
}

export interface EmailChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: EmailMetrics;
  campaignActivity: EmailCampaignActivity[];
  websiteActivity: EmailWebsiteActivity[];
}

// Props interfaces for components
export interface EmailMetricsOverviewProps {
  metrics?: EmailMetrics;
  isLoading?: boolean;
}

export interface EmailCampaignActivityProps {
  campaigns: EmailCampaignActivity[];
  isLoading?: boolean;
}

export interface EmailWebsiteActivityProps {
  activities: EmailWebsiteActivity[];
  isLoading?: boolean;
}

export interface EmailDashboardProps {
  data?: EmailChannelData;
  isLoading?: boolean;
  error?: string;
} 