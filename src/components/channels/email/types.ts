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
      totalOpens: number;
      totalClicks: number;
      totalBounces: number;
      totalUnsubscribes: number;
      totalDelivered: number;
      totalRequests: number;
      averageOpenRate: number;
      averageClickRate: number;
    };
    previousYear: {
      totalOpens: number;
      totalClicks: number;
      totalBounces: number;
      totalUnsubscribes: number;
      totalDelivered: number;
      totalRequests: number;
      averageOpenRate: number;
      averageClickRate: number;
    };
    yearOverYear: {
      opens: number;
      clicks: number;
      bounces: number;
      unsubscribes: number;
      openRate: number;
      clickRate: number;
    };
  };
  timeSeriesData: Array<{
    date: string;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    delivered: number;
    requests: number;
  }>;
  topCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    delivered: number;
    requests: number;
    uniqueOpens: number;
    uniqueClicks: number;
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