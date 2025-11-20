/**
 * @file src/components/analytics/GaMetrics.tsx
 * Server component that fetches and displays Google Analytics metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders GaMetricsGrid.
 */

'use client';

import { GaMetricsGrid } from './GaMetricsGrid';
import { GaAccountSelector } from './GaAccountSelector';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { Loader2 } from 'lucide-react';

interface GaMetricsProps {
  selectedPropertyId?: string | null;
  onPropertyChange?: (propertyId: string | null) => void;
}

/**
 * @component GaMetrics
 * Server component that fetches and displays Google Analytics metrics.
 * Uses Suspense for loading state management.
 *
 * @returns {Promise<JSX.Element>} GA metrics grid
 */
export default function GaMetrics({ selectedPropertyId, onPropertyChange }: GaMetricsProps) {
  const [data, setData] = useState<GaMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Handle property change - call parent callback if provided, otherwise manage locally
  const handlePropertyChange = useCallback((propertyId: string | null) => {
    if (onPropertyChange) {
      onPropertyChange(propertyId);
    }
  }, [onPropertyChange]);

  const getDefaultDateRange = () => {
    const today = new Date();
    // Get first day of current month
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Last day of previous month is one day before first day of current month
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);
    // First day of previous month
    const firstDayOfPreviousMonth = new Date(lastDayOfPreviousMonth.getFullYear(), lastDayOfPreviousMonth.getMonth(), 1);

    return {
      from: firstDayOfPreviousMonth,
      to: lastDayOfPreviousMonth
    };
  };

  // Fetch GA metrics with optional date range
  const fetchGaMetrics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    if (!selectedPropertyId) return; // Don't fetch if no property is selected
    setIsLoading(true);
    setError(null);

    try {
      // Build URL with date parameters if provided
      let url = '/api/client/ga-metrics';

      const effectiveRange = dateRange || currentDateRange || getDefaultDateRange();
      setCurrentDateRange(effectiveRange);

      // Always set up parameters now that we have a date range
      const params = new URLSearchParams();

      // Get the selected date range
      const selectedFrom = effectiveRange.from;
      const selectedTo = effectiveRange.to;

      // Always fetch two years of data for proper comparison
      // Get a date 1 year before the selected start date
      const extendedFrom = new Date(selectedFrom);
      extendedFrom.setFullYear(extendedFrom.getFullYear() - 1);

      // Use the extended date range for the API request
      params.append('from', format(extendedFrom, 'yyyy-MM-dd'));
      params.append('to', format(selectedTo, 'yyyy-MM-dd'));
      params.append('selectedFrom', format(selectedFrom, 'yyyy-MM-dd'));
      params.append('selectedTo', format(selectedTo, 'yyyy-MM-dd'));     // Original date range for display
      params.append('propertyId', selectedPropertyId);                   // Add property ID
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
  }, [selectedPropertyId, currentDateRange]);

  // Fetch data when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      fetchGaMetrics()
        .catch(err => {
          console.error('Failed to load initial GA metrics:', err);
        });
    }
  }, [selectedPropertyId, fetchGaMetrics]);

  // Reset error when account or property changes
  useEffect(() => {
    setError(null);
  }, [selectedAccountId, selectedPropertyId]);

  return (
    <div className="space-y-6">
      <GaAccountSelector
        onAccountChange={setSelectedAccountId}
        onPropertyChange={handlePropertyChange}
        onAccountObjectChange={setSelectedAccount}
        onPropertyObjectChange={setSelectedProperty}
      />

      {/* Metrics area: show error, loading, data, or empty state */}
      {error ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-center text-muted-foreground">Loading analytics data...</p>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <GaMetricsGrid
          data={data}
          onDateRangeChange={fetchGaMetrics}
          currentDateRange={currentDateRange}
        />
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              {selectedPropertyId ? 'No analytics data available' : 'Select a property to view analytics'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
