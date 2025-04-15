/**
 * @file src/hooks/use-chart-data.ts
 * Custom hook for fetching chart data for queries.
 * Uses SWR for data fetching, caching, and revalidation.
 */

import useSWR from 'swr';
import type { ParsedQueryData, ParsedPieGraphData } from '@prisma/client';
import { fetcher } from '@/lib/utils';

interface ChartDataResponse {
  parsedQueryData: ParsedQueryData[];
  parsedPieGraphData: ParsedPieGraphData[];
}

/**
 * Custom hook for fetching chart data for a specific query.
 * Features:
 * - Automatic caching and revalidation with SWR
 * - Type-safe response data
 * - Loading and error states
 * - Fallback to empty arrays if fetch fails
 * 
 * @param {string | null} queryId - The ID of the query to fetch data for, or null to skip fetching
 * @returns {Object} Hook return object
 * @property {ParsedQueryData[]} data.parsedQueryData - Array of parsed query data points
 * @property {ParsedPieGraphData[]} data.parsedPieGraphData - Array of parsed pie graph data points
 * @property {boolean} isLoading - Loading state
 * @property {Error | undefined} error - Error state if fetch fails
 */
export function useChartData(queryId: string | null) {
  const { data, error, isLoading } = useSWR<ChartDataResponse>(
    queryId ? `/api/queries/${queryId}/chart-data` : null,
    fetcher
  );

  console.log('useChartData data', data);

  return {
    data: {
      parsedQueryData: data?.parsedQueryData ?? [],
      parsedPieGraphData: data?.parsedPieGraphData ?? []
    },
    isLoading,
    error
  };
} 