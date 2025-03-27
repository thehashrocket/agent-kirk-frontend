/**
 * @file src/hooks/use-client-activity.ts
 * Custom hook for fetching and managing client activity data.
 * Provides real-time updates and caching using SWR.
 */

import useSWR from 'swr';
import { format } from 'date-fns';

interface ClientActivityParams {
  startDate: Date;
  endDate: Date;
  type: string;
}

interface ActivityMetric {
  label: string;
  value: number;
  change: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
}

interface ActionBreakdownItem {
  type: string;
  count: number;
  percentage: number;
}

interface ClientActivityData {
  metrics: {
    totalActivities: ActivityMetric;
    successRate: ActivityMetric;
    averageTime: ActivityMetric;
    uniqueActions: ActivityMetric;
  };
  activities: Activity[];
  actionBreakdown: ActionBreakdownItem[];
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch client activity data');
  }
  return response.json();
};

export function useClientActivity({ startDate, endDate, type }: ClientActivityParams) {
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');
  
  const { data, error, isLoading } = useSWR<ClientActivityData>(
    `/api/reports/client-activity?startDate=${formattedStartDate}&endDate=${formattedEndDate}&type=${type}`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    data,
    isLoading,
    isError: error,
  };
} 