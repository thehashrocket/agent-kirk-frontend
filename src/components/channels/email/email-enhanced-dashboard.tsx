/**
 * @file src/components/channels/email/email-enhanced-dashboard.tsx
 * Enhanced dashboard component for displaying email analytics data.
 * Provides comprehensive email metrics with interactive charts and tables.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Mail, MousePointer, AlertTriangle, UserMinus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MonthRangePicker } from '@/components/analytics/MonthRangePicker';
import type { EmailMetricsResponse } from './types';
import dayjs from 'dayjs';
import Link from 'next/link';

interface EmailEnhancedDashboardProps {
  data: EmailMetricsResponse;
  onDateRangeChange: (dateRange: { from: Date; to: Date }) => void;
}

// Utility to get first and last day of a month from any date
function getFullMonthRange(date: Date | string) {
  let year, month;
  if (typeof date === 'string') {
    // Parse as local date, not UTC, to avoid timezone issues
    const parts = date.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // JS months are 0-based
  } else {
    year = date.getFullYear();
    month = date.getMonth();
  }
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from, to };
}

export function EmailEnhancedDashboard({ data, onDateRangeChange }: EmailEnhancedDashboardProps) {
  // State for selected date range, starts as null like GaMetricsGrid
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Set dateRange from data on mount, using getFullMonthRange for consistent parsing
  useEffect(() => {
    if (data?.selectedRange?.from) {
      setDateRange(getFullMonthRange(data.selectedRange.from));
    }
  }, [data?.selectedRange?.from, data?.selectedRange?.to]);

  // Handler that updates local state immediately, like GaMetricsGrid
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range); // Update local state immediately
    onDateRangeChange(range); // Then call the callback
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const metrics = [
    {
      title: 'Total Opens',
      value: formatNumber(data.metrics.current.totalOpens),
      // change: data.metrics.yearOverYear.opens,
      icon: Mail,
      description: 'Total email opens',
    },
    {
      title: 'Total Clicks',
      value: formatNumber(data.metrics.current.totalClicks),
      // change: data.metrics.yearOverYear.clicks,
      icon: MousePointer,
      description: 'Total email clicks',
    },
    {
      title: 'Open Rate',
      value: `${(data.metrics.current.averageOpenRate * 100).toFixed(1)}%`,
      // change: data.metrics.yearOverYear.openRate,
      icon: TrendingUp,
      description: 'Average open rate',
    },
    {
      title: 'Click Rate',
      value: `${(data.metrics.current.averageClickRate * 100).toFixed(1)}%`,
      // change: data.metrics.yearOverYear.clickRate,
      icon: TrendingUp,
      description: 'Average click rate',
    },
    {
      title: 'Bounces',
      value: formatNumber(data.metrics.current.totalBounces),
      // change: data.metrics.yearOverYear.bounces,
      icon: AlertTriangle,
      description: 'Total bounces',
    },
    {
      title: 'Unsubscribes',
      value: formatNumber(data.metrics.current.totalUnsubscribes),
      // change: data.metrics.yearOverYear.unsubscribes,
      icon: UserMinus,
      description: 'Total unsubscribes',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {dayjs(data.selectedRange.from).format('MMM D, YYYY')} - {dayjs(data.selectedRange.to).format('MMM D, YYYY')}
          </p>
        </div>
        {dateRange && (
          <MonthRangePicker
            onChange={handleDateRangeChange}
            value={dateRange}
          />
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Delivered</span>
                <span className="font-medium">{formatNumber(data.metrics.current.totalDelivered)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Requests</span>
                <span className="font-medium">{formatNumber(data.metrics.current.totalRequests)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Rate</span>
                <span className="font-medium">
                  {data.metrics.current.totalRequests > 0
                    ? `${((data.metrics.current.totalDelivered / data.metrics.current.totalRequests) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Campaigns</span>
                <span className="font-medium">{data.totalCampaigns}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Campaigns</span>
                <span className="font-medium">{data.topCampaigns.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      {data.topCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-2">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 py-3 px-4 font-medium text-sm text-muted-foreground border-b">
              <div>Campaign</div>
              <div className="text-right">Sent</div>
              <div className="text-right">Delivered</div>
              <div className="text-right">Unique Opens</div>
              <div className="text-right">Unique Clicks</div>
              <div className="text-right">Unsubscribes</div>
            </div>
            
            {/* Campaigns List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.topCampaigns.map((campaign, index) => (
                <div 
                  key={campaign.campaignId} 
                  className="grid grid-cols-6 gap-4 items-center p-4 hover:bg-muted/50 rounded-lg"
                >
                  {/* Campaign Name */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-base font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/client/dashboard/email/${data.emailClient.id}/campaign/${campaign.campaignId}`}
                        className="inline-flex items-center font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {campaign.campaignName}
                        <ExternalLink className="ml-1 h-4 w-4 text-muted-foreground" aria-label="View campaign report" />
                      </Link>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(campaign.requests)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(campaign.delivered)}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.requests > 0 
                        ? `${((campaign.delivered / campaign.requests) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(campaign.uniqueOpens)}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.delivered > 0 
                        ? `${((campaign.uniqueOpens / campaign.delivered) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(campaign.uniqueClicks)}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.delivered > 0 
                        ? `${((campaign.uniqueClicks / campaign.delivered) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(campaign.unsubscribes)}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.delivered > 0 
                        ? `${((campaign.unsubscribes / campaign.delivered) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Data Preview */}
      {data.timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Showing {data.timeSeriesData.length} days of data
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(data.timeSeriesData.reduce((sum, day) => sum + day.opens, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Opens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(data.timeSeriesData.reduce((sum, day) => sum + day.clicks, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(data.timeSeriesData.reduce((sum, day) => sum + day.bounces, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Bounces</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(data.timeSeriesData.reduce((sum, day) => sum + day.unsubscribes, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Unsubscribes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 