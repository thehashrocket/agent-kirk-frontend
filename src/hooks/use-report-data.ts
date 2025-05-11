import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export interface ReportData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalActions: number;
    errorRate: number;
    averageResponseTime: number;
  };
  performanceMetrics: {
    cpu: number;
    memory: number;
    responseTime: number;
    errorRate: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    averageSessionDuration: number;
    retentionRate: number;
  };
  actions: any[]; // Replace with proper type if available
  activities: any[]; // Replace with proper type if available
}

export function useReportData() {
  const { data, error, isLoading } = useSWR<ReportData>('/api/reports', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
  });

  return {
    data,
    isLoading,
    isError: error,
  };
} 