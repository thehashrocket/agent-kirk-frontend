/**
 * @file src/components/channels/email/email-metrics.tsx
 * Main component that fetches and displays Email metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders EmailEnhancedDashboard.
 * 
 * Features:
 * - Email Client selection interface
 * - Data fetching with date range support
 * - Loading and error states
 * - Automatic data refresh on client change
 * - Previous month default date range
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EmailClientSelector } from './email-client-selector';
import { EmailEnhancedDashboard } from './email-enhanced-dashboard';
import type { EmailClient, EmailMetricsResponse } from './types';

/**
 * @component EmailMetrics
 * @path src/components/channels/email/email-metrics.tsx
 * Main component that fetches and displays Email metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders EmailEnhancedDashboard.
 * 
 * Features:
 * - Email Client selection interface
 * - Data fetching with date range support
 * - Loading and error states
 * - Automatic data refresh on client change
 * - Previous month default date range
 */
export default function EmailMetrics() {
  const [data, setData] = useState<EmailMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<EmailClient | null>(null);

  // Fetch Email metrics with optional date range
  const fetchEmailMetrics = useCallback(async (dateRange?: { from: Date; to: Date }) => {
    if (!selectedClientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with date parameters if provided
      let url = '/api/client/email-metrics';
      
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
      params.append('emailClientId', selectedClientId);                  // Add client ID
      
      url = `${url}?${params.toString()}`;
      
      const response = await fetch(url);

      console.log('Email Metrics API - Response:', response);

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
  }, [selectedClientId]);

  // Fetch data when client changes
  useEffect(() => {
    if (selectedClientId) {
      fetchEmailMetrics()
        .catch(err => {
          console.error('Failed to load initial Email metrics:', err);
        });
    }
  }, [selectedClientId, fetchEmailMetrics]);

  // Reset error when client changes
  useEffect(() => {
    setError(null);
  }, [selectedClientId]);

  return (
    <div className="space-y-6">
      <EmailClientSelector
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