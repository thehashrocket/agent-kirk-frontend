export interface GaMetricsResponse {
  kpiDaily: Array<{
    date: string;
    sessions: number;
    screenPageViewsPerSession: number;
    engagementRate: number;
    avgSessionDurationSec: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
  kpiMonthly: Array<{
    month: number;
    sessions: number;
    screenPageViewsPerSession: number;
    engagementRate: number;
    avgSessionDurationSec: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
  channelDaily: Array<{
    channelGroup: string;
    sessions: number;
    screenPageViewsPerSession: number;
    engagementRate: number;
    avgSessionDurationSec: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
  sourceDaily: Array<{
    trafficSource: string;
    sessions: number;
    screenPageViewsPerSession: number;
    engagementRate: number;
    avgSessionDurationSec: number;
    goalCompletions: number;
    goalCompletionRate: number;
  }> | null;
}

export interface GaMetricsError {
  error: string;
  code: string;
} 