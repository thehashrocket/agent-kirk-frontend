/**
 * @file src/components/channels/email/AccountRepEmailMetrics.tsx
 * Account Rep version of Email metrics component that displays analytics for their assigned clients.
 * Based on the client Email metrics component but uses the account-rep API endpoint.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles account rep email analytics display
 * - Open/Closed: Extensible for different data sources
 * - Liskov Substitution: Compatible with other metrics components
 * - Interface Segregation: Uses specific interfaces for its needs
 * - Dependency Inversion: Depends on abstractions (API endpoints) not concretions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EmailEnhancedDashboard } from './email-enhanced-dashboard';
import { AccountRepEmailClientSelector } from './AccountRepEmailClientSelector';
import type { EmailClient, EmailMetricsResponse } from './types';

interface AccountRepEmailMetricsProps {
  clientId: string;
}

/**
 * @component AccountRepEmailMetrics
 * Account Rep version of Email metrics component for viewing assigned client analytics data.
 * 
 * Features:
 * - Client-specific Email client selection
 * - Same analytics display as client dashboard
 * - Account rep-level access to assigned clients' data only
 * - Date range selection and filtering
 * 
 * @param {AccountRepEmailMetricsProps} props - Component props
 */
export function AccountRepEmailMetrics({ clientId }: AccountRepEmailMetricsProps) {
  const [data, setData] = useState<EmailMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<EmailClient | null>(null);

  // Fetch Email metrics with optional date range for the selected client
  const fetchEmailMetrics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    if (!selectedClientId || !clientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with date parameters if provided
      let url = '/api/account-rep/client-email-metrics';
      
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
      params.append('emailClientId', selectedClientId);                  // Add email client ID
      params.append('clientId', clientId);                               // Add client ID for account rep access
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url);

      console.log('Account Rep Email Metrics API - Response:', response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Email analytics data');
      }
      
      const metricsData = await response.json();
      setData(metricsData);
      return metricsData;
    } catch (error) {
      console.error('Error fetching Email metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Email analytics data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, clientId]);

  // Fetch data when email client changes
  useEffect(() => {
    if (selectedClientId && clientId) {
      fetchEmailMetrics()
        .catch(err => {
          console.error('Failed to load initial Email metrics:', err);
        });
    }
  }, [selectedClientId, clientId, fetchEmailMetrics]);

  // Reset data when client changes
  useEffect(() => {
    setData(null);
    setSelectedClientId(null);
    setSelectedClient(null);
    setError(null);
    setIsLoading(false);
  }, [clientId]);

  // Reset error when email client changes
  useEffect(() => {
    setError(null);
  }, [selectedClientId]);

  return (
    <div className="space-y-6">
      <AccountRepEmailClientSelector
        clientId={clientId}
        onClientChange={setSelectedClientId}
        onClientObjectChange={setSelectedClient}
      />
      
      {/* Dynamic Title */}
      {selectedClient && (
        <h2 className="text-xl font-semibold text-primary-700 mb-2">
          {selectedClient.clientName} – Email Analytics
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
              <p className="text-center text-muted-foreground">Loading Email analytics data...</p>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <EmailEnhancedDashboard 
          data={data} 
          onDateRangeChange={fetchEmailMetrics}
        />
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              {selectedClientId ? 'No Email analytics data available' : 'Select an Email Client to view analytics'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 