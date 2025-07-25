/**
 * @file src/components/analytics/PrintOptimizedGaMetrics.tsx
 * Print-optimized version of the GA metrics component.
 * Displays analytics data in a clean, print-friendly format without interactive elements.
 */

'use client';

import { PrintOptimizedGaMetricsGrid } from './PrintOptimizedGaMetricsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { Loader2 } from 'lucide-react';

interface PrintOptimizedGaMetricsProps {
  propertyId?: string | null;
}

/**
 * @component PrintOptimizedGaMetrics
 * Print-optimized version of GA metrics component.
 * Fetches and displays analytics data in a format suitable for printing.
 * 
 * Features:
 * - No interactive controls (account selector, date picker)
 * - Clean, print-friendly layout
 * - Includes account and property information
 * - Optimized typography and spacing
 * - Uses specified property ID or falls back to first available property
 * 
 * @returns {JSX.Element} Print-optimized GA metrics grid
 */
export function PrintOptimizedGaMetrics({ propertyId }: PrintOptimizedGaMetricsProps) {
  const [data, setData] = useState<GaMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<{
    accountName: string;
    propertyName: string;
  } | null>(null);

  // Fetch GA metrics for the specified or first available property
  const fetchGaMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the user data with GA accounts and properties
      const userResponse = await fetch('/api/users/me');
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      
      // Transform the nested userToGaAccounts data into the expected format (same as GaAccountSelector)
      const fetchedAccounts = userData.userToGaAccounts?.map((userToGaAccount: any) => ({
        id: userToGaAccount.gaAccount.id,
        gaAccountId: userToGaAccount.gaAccount.gaAccountId,
        gaAccountName: userToGaAccount.gaAccount.gaAccountName,
        gaProperties: userToGaAccount.gaAccount.gaProperties.map((property: any) => ({
          id: property.id,
          gaPropertyId: property.gaPropertyId,
          gaPropertyName: property.gaPropertyName
        }))
      })) || [];
      
      if (!fetchedAccounts || fetchedAccounts.length === 0) {
        throw new Error('No GA accounts found');
      }
      
      // Find the specified property or fall back to the first property
      let targetProperty = null;
      let targetAccount = null;
      
      if (propertyId) {
        // Look for the specified property across all accounts
        for (const account of fetchedAccounts) {
          const property = account.gaProperties.find((prop: any) => prop.id === propertyId);
          if (property) {
            targetProperty = property;
            targetAccount = account;
            break;
          }
        }
      }
      
      // If no specific property found or specified, use the first available property
      if (!targetProperty) {
        targetAccount = fetchedAccounts[0];
        targetProperty = targetAccount.gaProperties?.[0];
      }
      
      if (!targetProperty) {
        throw new Error('No GA properties found');
      }
      
      // Store account info for display
      setAccountInfo({
        accountName: targetAccount.gaAccountName,
        propertyName: targetProperty.gaPropertyName
      });
      
      // Fetch metrics for this property
      // Use previous full month as default range
      const today = new Date();
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
      lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);
      const firstDayOfPreviousMonth = new Date(lastDayOfPreviousMonth.getFullYear(), lastDayOfPreviousMonth.getMonth(), 1);
      
      // Get two years of data for comparison
      const extendedFrom = new Date(firstDayOfPreviousMonth);
      extendedFrom.setFullYear(extendedFrom.getFullYear() - 1);
      
      const params = new URLSearchParams({
        from: extendedFrom.toISOString().split('T')[0],
        to: lastDayOfPreviousMonth.toISOString().split('T')[0],
        selectedFrom: firstDayOfPreviousMonth.toISOString().split('T')[0],
        selectedTo: lastDayOfPreviousMonth.toISOString().split('T')[0],
        propertyId: targetProperty.id  // Use the internal database ID, not gaPropertyId
      });
      
      const metricsResponse = await fetch(`/api/client/ga-metrics?${params.toString()}`);
      if (!metricsResponse.ok) {
        const errorData = await metricsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch analytics data');
      }
      
      const metricsData = await metricsResponse.json();
      setData(metricsData);
    } catch (error) {
      console.error('Error fetching GA metrics for print:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  // Fetch data on mount
  useEffect(() => {
    fetchGaMetrics();
  }, [fetchGaMetrics]);

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
            <p className="text-center text-muted-foreground">Loading analytics data...</p>
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
          <p className="text-center text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">      
      {/* Print-optimized metrics grid */}
      <PrintOptimizedGaMetricsGrid data={data} />
    </div>
  );
} 