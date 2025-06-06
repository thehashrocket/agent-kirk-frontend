'use client';

import React from 'react';
import useSWR from 'swr';
import { PaidSearchMetricsOverview } from './paid-search-metrics-overview';
import { PaidSearchCampaignsTable } from './paid-search-campaigns-table';
import { PaidSearchPerformanceChart } from './paid-search-performance-chart';
import { PaidSearchFacebookCampaigns } from './paid-search-facebook-campaigns';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { fetcher } from '@/lib/utils';
import type { PaidSearchChannelData } from './types';

export function PaidSearchDashboard() {
  const { data, error, isLoading } = useSWR<PaidSearchChannelData>(
    '/api/channels/paid-search',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <Card className="p-6">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-destructive mb-1">
              Failed to load paid search data
            </h3>
            <p className="text-sm text-muted-foreground">
              {error.message || 'An error occurred while fetching data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vetta Sports Google Ads - Kickaroos Comparison
          </h1>
          {data?.dateRange && (
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(data.dateRange.start).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })} - {new Date(data.dateRange.end).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          )}
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 border rounded text-sm bg-background">
            {data?.dateRange ? (
              `${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`
            ) : (
              'Select Date Range'
            )}
          </div>
        </div>
      </div>

      {/* Campaign Overview */}
      <PaidSearchMetricsOverview 
        campaignOverview={data?.campaignOverview || []} 
        isLoading={isLoading} 
      />

      {/* All Campaigns Table */}
      <PaidSearchCampaignsTable 
        campaigns={data?.allCampaigns || []} 
        isLoading={isLoading} 
      />

      {/* Performance Chart */}
      <PaidSearchPerformanceChart 
        data={data?.performanceData || []} 
        isLoading={isLoading} 
      />

      {/* Facebook Campaigns */}
      <PaidSearchFacebookCampaigns 
        facebookCampaigns={data?.facebookCampaigns || []} 
        isLoading={isLoading} 
      />
    </div>
  );
} 