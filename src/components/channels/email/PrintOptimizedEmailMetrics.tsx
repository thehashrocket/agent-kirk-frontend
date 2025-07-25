/**
 * @file src/components/channels/email/PrintOptimizedEmailMetrics.tsx
 * Print-optimized version of the Email metrics component.
 * Displays email analytics data in a clean, print-friendly format without interactive elements.
 */

'use client';

import { PrintOptimizedEmailDashboard } from './PrintOptimizedEmailDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect, useCallback } from 'react';
import type { EmailMetricsResponse } from './types';
import { Loader2 } from 'lucide-react';

interface PrintOptimizedEmailMetricsProps {
  clientId?: string | null;
}

/**
 * @component PrintOptimizedEmailMetrics
 * Print-optimized version of Email metrics component.
 * Fetches and displays email analytics data in a format suitable for printing.
 * 
 * Features:
 * - No interactive controls (client selector, date picker)
 * - Clean, print-friendly layout
 * - Includes client information
 * - Optimized typography and spacing
 * - Uses specified client ID or falls back to first available client
 * 
 * @returns {JSX.Element} Print-optimized Email metrics grid
 */
export function PrintOptimizedEmailMetrics({ clientId }: PrintOptimizedEmailMetricsProps) {
  const [data, setData] = useState<EmailMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<{
    clientName: string;
  } | null>(null);

  // Fetch Email metrics for the specified or first available client
  const fetchEmailMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get the user's email clients
      const response = await fetch('/api/client/email-clients');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Email Clients');
      }
      
      const emailClients = await response.json();
      
      if (!emailClients || emailClients.length === 0) {
        throw new Error('No Email clients found');
      }
      
      // Find the specified client or fall back to the first client
      let targetClient = null;
      
      if (clientId) {
        // Look for the specified client
        targetClient = emailClients.find((client: any) => client.id === clientId);
      }
      
      // If no specific client found or specified, use the first available client
      if (!targetClient) {
        targetClient = emailClients[0];
      }
      
      if (!targetClient) {
        throw new Error('No Email clients found');
      }
      
      // Store client info for display
      setClientInfo({
        clientName: targetClient.clientName
      });
      
      // Fetch metrics for this client
      // Use a sensible historical date range instead of calculating from current date
      // This prevents issues when system date is set incorrectly or in the future
        // Calculate default date range
        const referenceDate = new Date(2025, 5, 30); // June 30, 2025
        const firstDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const lastDayOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      
      // Get two years of data for comparison (from June 2023 to June 2024)
      const extendedFrom = new Date(firstDayOfMonth);
      extendedFrom.setFullYear(extendedFrom.getFullYear() - 1);
      
      const params = new URLSearchParams({
        from: extendedFrom.toISOString().split('T')[0],
        to: lastDayOfMonth.toISOString().split('T')[0],
        selectedFrom: firstDayOfMonth.toISOString().split('T')[0],
        selectedTo: lastDayOfMonth.toISOString().split('T')[0],
        emailClientId: targetClient.id  // Use the client ID
      });
      
      const metricsResponse = await fetch(`/api/client/email-metrics?${params.toString()}`);
      if (!metricsResponse.ok) {
        const errorData = await metricsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch email analytics data');
      }
      
      const metricsData = await metricsResponse.json();
      setData(metricsData);
    } catch (error) {
      console.error('Error fetching Email metrics for print:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch email analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Fetch data on mount
  useEffect(() => {
    fetchEmailMetrics();
  }, [fetchEmailMetrics]);

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
            <p className="text-center text-muted-foreground">Loading email analytics data...</p>
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
          <p className="text-center text-muted-foreground">No email analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Information */}
      {clientInfo && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary-700 mb-2">
            {clientInfo.clientName} – Email Analytics
          </h2>
        </div>
      )}
      
      {/* Print-optimized email metrics dashboard */}
      <PrintOptimizedEmailDashboard data={data} />
    </div>
  );
} 