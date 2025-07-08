'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Users, Eye, Heart, MousePointer, Video } from 'lucide-react';
import { format } from 'date-fns';
import type { SproutSocialMetricsResponse } from './types';
import { computeMetrics } from './types';

interface SproutSocialDashboardProps {
  data?: SproutSocialMetricsResponse;
  onDateRangeChange?: (dateRange: { from: Date; to: Date }) => void;
}

export function SproutSocialDashboard({ data, onDateRangeChange }: SproutSocialDashboardProps) {
  if (!data) {
    return (
      <Card className="p-6">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-lg font-semibold mb-1">
              No data available
            </h3>
            <p className="text-sm text-muted-foreground">
              Select an account to view SproutSocial analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated metrics from raw data
  const calculateMetrics = (metrics: any[]) => {
    if (!metrics || metrics.length === 0) {
      return {
        totalEngagements: 0,
        totalImpressions: 0,
        totalFollowers: 0,
        totalVideoViews: 0,
        avgEngagementRate: 0,
      };
    }

    const totals = metrics.reduce((acc, metric) => {
      acc.engagements += metric.engagements || 0;
      acc.impressions += metric.impressions || metric.impressionsUnique || 0;
      acc.videoViews += metric.videoViews || 0;
      return acc;
    }, { engagements: 0, impressions: 0, videoViews: 0 });

    // Get the latest follower count
    const latestMetric = metrics[metrics.length - 1];
    const followers = latestMetric?.followersCount || 0;

    return {
      totalEngagements: totals.engagements,
      totalImpressions: totals.impressions,
      totalFollowers: followers,
      totalVideoViews: totals.videoViews,
      avgEngagementRate: totals.impressions > 0 ? (totals.engagements / totals.impressions) * 100 : 0,
    };
  };

  const currentMetrics = calculateMetrics(data.metrics);
  const comparisonMetrics = calculateMetrics(data.comparisonMetrics);

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const engagementChange = calculateChange(currentMetrics.totalEngagements, comparisonMetrics.totalEngagements);
  const impressionChange = calculateChange(currentMetrics.totalImpressions, comparisonMetrics.totalImpressions);
  const followerChange = calculateChange(currentMetrics.totalFollowers, comparisonMetrics.totalFollowers);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {data.account.name} Performance
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{data.platformType}</Badge>
            {data.dateRange && (
              <p className="text-sm text-muted-foreground">
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
        </div>
        
        {/* Date Range Picker - Could be implemented later */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 border rounded text-sm bg-background">
            {data.dateRange ? (
              `${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`
            ) : (
              'Select Date Range'
            )}
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Engagements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Engagements
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMetrics.totalEngagements)}</div>
            <div className="flex items-center text-xs">
              {engagementChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={engagementChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(engagementChange)}
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Impressions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMetrics.totalImpressions)}</div>
            <div className="flex items-center text-xs">
              {impressionChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={impressionChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(impressionChange)}
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Followers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Followers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMetrics.totalFollowers)}</div>
            <div className="flex items-center text-xs">
              {followerChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={followerChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(followerChange)}
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.avgEngagementRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Average engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform-Specific Metrics */}
      {data.platformType.toLowerCase() === 'facebook' && (
        <Card>
          <CardHeader>
            <CardTitle>Facebook Specific Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Video Views</p>
                <p className="text-2xl font-bold">{formatNumber(currentMetrics.totalVideoViews)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Link Clicks</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.metrics?.reduce((acc: number, m: any) => acc + (m.postLinkClicks || 0), 0) || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Photo View Clicks</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.metrics?.reduce((acc: number, m: any) => acc + (m.postPhotoViewClicks || 0), 0) || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform</p>
              <p className="font-semibold">{data.platformType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Name</p>
              <p className="font-semibold">{data.account.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Native Name</p>
              <p className="font-semibold">{data.account.nativeName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Profile ID</p>
              <p className="font-semibold">{data.account.customerProfileId}</p>
            </div>
          </div>
          {data.account.link && (
            <div className="mt-4">
              <a 
                href={data.account.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-700 underline"
              >
                View Profile →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 