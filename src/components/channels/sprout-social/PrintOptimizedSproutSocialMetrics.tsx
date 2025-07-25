/**
 * @file src/components/channels/sprout-social/PrintOptimizedSproutSocialMetrics.tsx
 * Print-optimized version of the SproutSocial metrics component.
 * Displays social analytics data in a clean, print-friendly format without interactive elements.
 */

'use client';

import { PrintOptimizedSproutSocialDashboard } from './PrintOptimizedSproutSocialDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import type { SproutSocialMetricsResponse } from './types';
import { Loader2 } from 'lucide-react';

interface PrintOptimizedSproutSocialMetricsProps {
  accountId?: string | null;
}

/**
 * @component PrintOptimizedSproutSocialMetrics
 * Print-optimized version of SproutSocial metrics component.
 * Fetches and displays social analytics data in a format suitable for printing.
 * 
 * Features:
 * - No interactive controls (account selector, date picker)
 * - Clean, print-friendly layout
 * - Includes account information
 * - Optimized typography and spacing
 * - Uses specified account ID or falls back to first available account
 * 
 * @returns {JSX.Element} Print-optimized SproutSocial metrics grid
 */
export function PrintOptimizedSproutSocialMetrics({ accountId }: PrintOptimizedSproutSocialMetricsProps) {
  const [data, setData] = useState<SproutSocialMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<{
    accountName: string;
    socialNetwork: string;
  } | null>(null);

  // Fetch SproutSocial metrics for the specified or first available account
  const fetchSproutSocialMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the user's SproutSocial accounts
      const response = await fetch('/api/client/sprout-social-accounts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch SproutSocial Accounts');
      }
      
      const accounts = await response.json();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No SproutSocial accounts found');
      }
      
      // Find the specified account or fall back to the first account
      let targetAccount = null;
      
      if (accountId) {
        // Look for the specified account
        targetAccount = accounts.find((account: any) => account.id === accountId);
      }
      
      // If no specific account found or specified, use the first available account
      if (!targetAccount) {
        targetAccount = accounts[0];
      }
      
      if (!targetAccount) {
        throw new Error('No SproutSocial accounts found');
      }
      
      // Store account info for display
      setAccountInfo({
        accountName: targetAccount.accountName,
        socialNetwork: targetAccount.socialNetwork
      });
      
      // Fetch metrics for this account
      // Use a fixed reference date to ensure we don't get future dates
      const referenceDate = new Date(2025, 5, 30); // June 30, 2025
      const firstDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const lastDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      
      // Get two years of data for comparison (from June 2024 to June 2025)
      const extendedFrom = new Date(firstDayOfMonth);
      extendedFrom.setFullYear(extendedFrom.getFullYear() - 1);
      
      const params = new URLSearchParams({
        from: extendedFrom.toISOString().split('T')[0],
        to: lastDayOfMonth.toISOString().split('T')[0],
        selectedFrom: firstDayOfMonth.toISOString().split('T')[0],
        selectedTo: lastDayOfMonth.toISOString().split('T')[0],
        accountId: targetAccount.id  // Use the account ID
      });
      
      const metricsResponse = await fetch(`/api/client/sprout-social-metrics?${params.toString()}`);
      if (!metricsResponse.ok) {
        const errorData = await metricsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch social analytics data');
      }
      
      const metricsData = await metricsResponse.json();
      setData(metricsData);
    } catch (error) {
      console.error('Error fetching SproutSocial metrics for print:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch social analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  // Fetch data on mount
  useEffect(() => {
    fetchSproutSocialMetrics();
  }, [fetchSproutSocialMetrics]);

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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-center text-muted-foreground">Loading social analytics data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle no data state
  if (!data) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No social analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">      
      {/* Print-optimized social metrics dashboard */}
      <PrintOptimizedSproutSocialDashboard data={data} />
    </div>
  );
} 