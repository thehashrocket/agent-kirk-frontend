'use client';

import React from 'react';
import useSWR from 'swr';
import { PaidSocialMetricsOverview } from './paid-social-metrics-overview';
import { PaidSocialEngagementTable } from './paid-social-engagement-table';
import { PaidSocialCampaignOverview } from './paid-social-campaign-overview';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { fetcher } from '@/lib/utils';
import type { PaidSocialChannelData } from './types';

export function PaidSocialDashboard() {
  const { data, error, isLoading } = useSWR<PaidSocialChannelData>(
    '/api/channels/paid-social',
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
              Failed to load paid social data
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
            Vetta Sports Facebook & Instagram Ads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Overview</p>
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

      {/* Campaign Stats Overview */}
      <PaidSocialMetricsOverview 
        metrics={data?.metrics} 
        isLoading={isLoading} 
      />

      {/* Facebook & Instagram Ads Engagement */}
      <PaidSocialEngagementTable 
        engagementData={data?.engagementData || []} 
        isLoading={isLoading} 
      />

      {/* Campaign Overview */}
      <PaidSocialCampaignOverview 
        campaignOverview={data?.campaignOverview || []} 
        isLoading={isLoading} 
      />
    </div>
  );
} 