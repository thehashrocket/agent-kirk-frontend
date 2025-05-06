/**
 * @file src/components/analytics/GaMetrics.tsx
 * Server component that fetches and displays Google Analytics metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders GaMetricsGrid.
 */

'use client';

import { GaMetricsGrid } from './GaMetricsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';

/**
 * @component GaMetrics
 * Server component that fetches and displays Google Analytics metrics.
 * Uses Suspense for loading state management.
 *
 * @returns {Promise<JSX.Element>} GA metrics grid
 */
export default function GaMetrics() {
  const [data, setData] = useState<GaMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch GA metrics with optional date range
  const fetchGaMetrics = async (dateRange?: { from: Date; to: Date }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with date parameters if provided
      let url = '/api/client/ga-metrics';
      
      // If no date range is provided, use previous full month as default
      if (!dateRange) {
        const today = new Date();
        // Get first day of current month
        const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Last day of previous month is one day before first day of current month
        const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
        lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);
        // First day of previous month
        const firstDayOfPreviousMonth = new Date(lastDayOfPreviousMonth.getFullYear(), lastDayOfPreviousMonth.getMonth(), 1);
        
        // Use previous month as default range
        dateRange = {
          from: firstDayOfPreviousMonth,
          to: lastDayOfPreviousMonth
        };
      }
      
      // Always set up parameters now that we have a date range
      const params = new URLSearchParams();
      
      // Get the selected date range
      const selectedFrom = dateRange.from;
      const selectedTo = dateRange.to;
      
      // Always fetch two years of data for proper comparison
      // Get a date 1 year before the selected start date
      const extendedFrom = new Date(selectedFrom);
      extendedFrom.setFullYear(extendedFrom.getFullYear() - 1);
      
      // Use the extended date range for the API request
      params.append('from', format(extendedFrom, 'yyyy-MM-dd'));
      params.append('to', format(selectedTo, 'yyyy-MM-dd'));
      params.append('selectedFrom', format(selectedFrom, 'yyyy-MM-dd')); // Original date range for display
      params.append('selectedTo', format(selectedTo, 'yyyy-MM-dd'));     // Original date range for display
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const metricsData = await response.json();
      setData(metricsData);
      return metricsData;
    } catch (error) {
      console.error('Error fetching GA metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchGaMetrics()
      .catch(err => {
        console.error('Failed to load initial GA metrics:', err);
      });
  }, []);

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (isLoading && !data) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Loading analytics data...</p>
        </CardContent>
      </Card>
    );
  }

  // Render the dashboard with data and callback for date range changes
  return (
    <div>
      {data ? (
        <GaMetricsGrid 
          data={data} 
          onDateRangeChange={fetchGaMetrics}
        />
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 