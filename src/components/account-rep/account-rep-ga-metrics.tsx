/**
 * @file src/components/account-rep/account-rep-ga-metrics.tsx
 * Account Rep version of GA metrics component that displays analytics for their assigned clients.
 * Based on the admin GA metrics component but uses the account-rep API endpoint.
 */

'use client';

import { GaMetricsGrid } from '@/components/analytics/GaMetricsGrid';
import { AccountRepGaAccountSelector } from '@/components/account-rep/account-rep-ga-account-selector';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { Loader2 } from 'lucide-react';

interface AccountRepGaMetricsProps {
  clientId: string;
}

/**
 * @component AccountRepGaMetrics
 * Account Rep version of GA metrics component for viewing assigned client analytics data.
 * 
 * Features:
 * - Client-specific GA account and property selection
 * - Same analytics display as admin dashboard
 * - Account rep-level access to assigned clients' data only
 * - Date range selection and filtering
 * 
 * @param {AccountRepGaMetricsProps} props - Component props
 */
export function AccountRepGaMetrics({ clientId }: AccountRepGaMetricsProps) {
  const [data, setData] = useState<GaMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

  // Fetch GA metrics with optional date range for the selected client
  const fetchGaMetrics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    if (!selectedPropertyId || !clientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with date parameters if provided
      let url = '/api/account-rep/client-ga-metrics';
      
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
      params.append('selectedFrom', format(selectedFrom, 'yyyy-MM-dd'));
      params.append('selectedTo', format(selectedTo, 'yyyy-MM-dd'));
      params.append('propertyId', selectedPropertyId);
      params.append('clientId', clientId); // Add client ID for account rep access
      
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
  }, [selectedPropertyId, clientId]);

  // Fetch data when property changes
  useEffect(() => {
    if (selectedPropertyId && clientId) {
      fetchGaMetrics()
        .catch(err => {
          console.error('Failed to load initial GA metrics:', err);
        });
    }
  }, [selectedPropertyId, clientId, fetchGaMetrics]);

  // Reset data when client changes
  useEffect(() => {
    setData(null);
    setSelectedPropertyId(null);
    setSelectedAccountId(null);
    setSelectedAccount(null);
    setSelectedProperty(null);
    setError(null);
    setIsLoading(true);
  }, [clientId]);

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

  return (
    <div className="space-y-6">
      <AccountRepGaAccountSelector
        clientId={clientId}
        onAccountChange={setSelectedAccountId}
        onPropertyChange={setSelectedPropertyId}
        onAccountObjectChange={setSelectedAccount}
        onPropertyObjectChange={setSelectedProperty}
      />
      
      {/* Dynamic Title */}
      {selectedAccount && selectedProperty && (
        <h2 className="text-xl font-semibold text-primary-700 mb-2">
          {selectedAccount.gaAccountName} – {selectedProperty.gaPropertyName}
        </h2>
      )}
      
      {isLoading ? (
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