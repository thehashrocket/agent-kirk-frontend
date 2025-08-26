export interface GaMetricsResponse {
  kpiDaily: Array<{
    id: string;
    date: string;
    sessions: number;
    screenPageViewsPerSession: number;
    avgSessionDurationSec: number;
    engagementRate: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
  kpiMonthly: Array<{
    id: string;
    month: number;
    sessions: number;
    screenPageViewsPerSession: number;
    avgSessionDurationSec: number;
    engagementRate: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
  channelDaily: Array<{
    id: string;
    date: string;
    users: number;
    newUsers: number;
    channelGroup: string;
    sessions: number;
  }> | null;
  sourceDaily: Array<{
    id: string;
    date: string;
    users: number;
    newUsers: number;
    trafficSource: string;
    sessions: number;
  }> | null;
  metadata?: {
    displayDateRange: {
      from: string;
      to: string;
    };
    fullDateRange: {
      from: string;
      to: string;
    };
  };
}

export interface GaMetricsError {
  error: string;
  code: string;
}