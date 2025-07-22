'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SproutSocialAccountSelector } from './sprout-social-account-selector';
import { SproutSocialEnhancedDashboard } from './sprout-social-enhanced-dashboard';
import type { SproutSocialAccount, SproutSocialMetricsResponse } from './types';
import { normalizeSocialNetworkName } from '@/lib/utils/normalize-social-network-names';

/**
 * @component SproutSocialMetrics
 * @path src/components/channels/sprout-social/sprout-social-metrics.tsx
 * Main component that fetches and displays SproutSocial metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders SproutSocialDashboard.
 * 
 * Features:
 * - Account selection interface
 * - Data fetching with date range support
 * - Loading and error states
 * - Automatic data refresh on account change
 * - Previous month default date range
 */
export default function SproutSocialMetrics() {
  const [data, setData] = useState<SproutSocialMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<SproutSocialAccount | null>(null);

  // Fetch SproutSocial metrics with optional date range
  const fetchSproutSocialMetrics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    if (!selectedAccountId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with date parameters if provided
      let url = '/api/client/sprout-social-metrics';
      
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
      params.append('accountId', selectedAccountId);                      // Add account ID
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Social Media analytics data');
      }
      
      const metricsData = await response.json();
      setData(metricsData);
      return metricsData;
    } catch (error) {
      console.error('Error fetching Social Media metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Social Media analytics data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  // Fetch data when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchSproutSocialMetrics()
        .catch(err => {
          console.error('Failed to load initial Social Media metrics:', err);
        });
    }
  }, [selectedAccountId, fetchSproutSocialMetrics]);

  // Reset error when account changes
  useEffect(() => {
    setError(null);
  }, [selectedAccountId]);

  return (
    <div className="space-y-6">
      <SproutSocialAccountSelector
        onAccountChange={setSelectedAccountId}
        onAccountObjectChange={setSelectedAccount}
      />
      
      {/* Dynamic Title */}
      {selectedAccount && (
        <h2 className="text-xl font-semibold text-primary-700 mb-2">
          {selectedAccount.name} – {normalizeSocialNetworkName(selectedAccount.networkType)} Analytics
        </h2>
      )}
      
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
              <p className="text-center text-muted-foreground">Loading Social Media analytics data...</p>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <SproutSocialEnhancedDashboard 
          data={data} 
          onDateRangeChange={fetchSproutSocialMetrics}
        />
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              {selectedAccountId ? 'No Social Media analytics data available' : 'Select an account to view analytics'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 