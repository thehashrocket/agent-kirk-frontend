export interface EmailClient {
  id: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailMetricsResponse {
  emailClient: {
    id: string;
    clientName: string;
  };
  selectedRange: {
    from: string;
    to: string;
  };
  metrics: {
    current: {
      averageClickRate: number;
      averageOpenRate: number;
      totalBounces: number;
      totalClicks: number;
      totalDelivered: number;
      totalOpens: number;
      totalRequests: number;
      totalUnsubscribes: number;
    };
  };
  topCampaigns: Array<{
    bounces: number;
    campaignId: string;
    campaignName: string;
    clicks: number;
    delivered: number;
    opens: number;
    requests: number;
    subject: string | null;
    uniqueClicks: number;
    uniqueOpens: number;
    unsubscribes: number;
  }>;
  totalCampaigns: number;
}

// Props interfaces for components
export interface EmailMetricsOverviewProps {
  metrics?: EmailMetricsResponse;
  isLoading?: boolean;
}

export interface EmailCampaignActivityProps {
  campaigns: EmailMetricsResponse['topCampaigns'];
  isLoading?: boolean;
}

export interface EmailDashboardProps {
  data?: EmailMetricsResponse;
  isLoading?: boolean;
  error?: string;
}

export interface EmailWebsiteActivityProps {
  activities: Array<{
    id: string;
    campaign: string;
    source: string;
    medium: string;
    adContent: string;
    users: number;
    newUsers: number;
    sessions: number;
    avgSessionDuration: string;
  }>;
  isLoading?: boolean;
}