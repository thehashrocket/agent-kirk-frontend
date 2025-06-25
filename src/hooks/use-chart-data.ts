/**
 * @file src/hooks/use-chart-data.ts
 * Custom hook for fetching chart data for queries.
 * Uses SWR for data fetching, caching, and revalidation.
 */

import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { ParsedQueryData, ParsedQuerySummary, ParsedPieGraphData } from '@/prisma/generated/client';

interface ChartDataResponse {
  parsedQueryData: ParsedQueryData[];
  parsedPieGraphData: ParsedPieGraphData[];
  parsedQuerySummary: ParsedQuerySummary[];
}

/**
 * Custom hook for fetching chart data for a specific query.
 * Features:
 * - Automatic caching and revalidation with SWR
 * - Type-safe response data from Prisma models
 * - Loading and error states
 * - Fallback to empty arrays if fetch fails
 * 
 * @param {string | null} queryId - The ID of the query to fetch data for, or null to skip fetching
 * @returns {Object} Hook return object
 * @property {ParsedQuerySummary[]} data.parsedQueryData - Array of parsed query summary data points
 * @property {ParsedPieGraphData[]} data.parsedPieGraphData - Array of parsed pie graph data points
 * @property {boolean} isLoading - Loading state
 * @property {Error | undefined} error - Error state if fetch fails
 */
export function useChartData(queryId: string | null) {
  // remove '-response' from queryId if it exists
  const queryIdWithoutResponse = queryId?.endsWith('-response')
    ? queryId.slice(0, -9)  // Remove exactly '-response'
    : queryId;

  // Only log when we actually have a queryId to avoid spam
  if (queryIdWithoutResponse) {
    console.log('useChartData - Original QueryId:', queryId);
    console.log('useChartData - Transformed QueryId:', queryIdWithoutResponse);
  }

  const { data, error, isLoading } = useSWR<ChartDataResponse>(
    queryIdWithoutResponse ? `/api/queries/${queryIdWithoutResponse}/chart-data` : null,
    fetcher
  );

  return {
    data: {
      parsedQueryData: data?.parsedQueryData ?? [],
      parsedQuerySummary: data?.parsedQuerySummary ?? [],
      parsedPieGraphData: data?.parsedPieGraphData ?? []
    },
    isLoading,
    error
  };
} 