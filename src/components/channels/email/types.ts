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
      averageUniqueClickRate: number;
      averageOpenRate: number;
      averageUniqueOpenRate: number;
      averageDeliveryRate: number;
      averageBounceRate: number;
      averageUnsubscribeRate: number;
      averageSpamReportRate: number;
      totalBounces: number;
      totalClicks: number;
      totalUniqueClicks: number;
      totalDelivered: number;
      totalOpens: number;
      totalUniqueOpens: number;
      totalRequests: number;
      totalUnsubscribes: number;
      totalSpamReports: number;
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
    sendTime?: string | null;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
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
