/**
 * @file src/components/channels/email/PrintOptimizedEmailDashboard.tsx
 * Print-optimized version of the EmailEnhancedDashboard component.
 * Displays email analytics data without interactive controls, optimized for printing.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Mail, MousePointer, AlertTriangle, UserMinus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailMetricsResponse } from './types';
import dayjs from 'dayjs';
import Link from 'next/link';

interface PrintOptimizedEmailDashboardProps {
  data: EmailMetricsResponse;
}

/**
 * PrintOptimizedEmailDashboard Component
 *
 * Purpose:
 *   - Displays email analytics dashboard data in a print-friendly format
 *   - No interactive controls (date pickers, selectors)
 *   - Clean layout optimized for printing
 *   - Includes all charts and data tables
 *
 * Props:
 *   - data: Email analytics data to display (see EmailMetricsResponse type)
 */
export function PrintOptimizedEmailDashboard({ data }: PrintOptimizedEmailDashboardProps) {
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
      change: data.metrics.yearOverYear.opens,
      icon: Mail,
      description: 'Total email opens',
    },
    {
      title: 'Total Clicks',
      value: formatNumber(data.metrics.current.totalClicks),
      change: data.metrics.yearOverYear.clicks,
      icon: MousePointer,
      description: 'Total email clicks',
    },
    {
      title: 'Open Rate',
      value: `${(data.metrics.current.averageOpenRate * 100).toFixed(1)}%`,
      change: data.metrics.yearOverYear.openRate,
      icon: TrendingUp,
      description: 'Average open rate',
    },
    {
      title: 'Click Rate',
      value: `${(data.metrics.current.averageClickRate * 100).toFixed(1)}%`,
      change: data.metrics.yearOverYear.clickRate,
      icon: MousePointer,
      description: 'Average click rate',
    },
    {
      title: 'Total Bounces',
      value: formatNumber(data.metrics.current.totalBounces),
      change: data.metrics.yearOverYear.bounces,
      icon: AlertTriangle,
      description: 'Total bounced emails',
    },
    {
      title: 'Total Unsubscribes',
      value: formatNumber(data.metrics.current.totalUnsubscribes),
      change: data.metrics.yearOverYear.unsubscribes,
      icon: UserMinus,
      description: 'Total unsubscribes',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Email Marketing Performance</h1>
        <h2 className="text-xl font-bold mb-2">Email Campaign Overview</h2>
        <p className="text-gray-500 mb-2">
          {dayjs(data.selectedRange.from).format('MMM D, YYYY')} - {dayjs(data.selectedRange.to).format('MMM D, YYYY')}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Showing email metrics with year-over-year comparison
        </p>
      </div>
      
      {/* Metrics summary card grid */}
      <div className="avoid-break mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs mt-1">
                  {getTrendIcon(metric.change)}
                  <span className={cn("ml-1", getTrendColor(metric.change))}>
                    {formatPercentage(metric.change)} from last year
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Campaigns Table */}
      <div className="avoid-break mt-8">
        <h2 className="text-lg font-bold mb-4">Top Performing Campaigns</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Campaign</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Opens</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Clicks</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Delivered</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Bounces</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Unsubscribes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topCampaigns.slice(0, 10).map((campaign, index) => (
                <tr key={campaign.campaignId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm text-gray-900">{campaign.campaignName}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatNumber(campaign.opens)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatNumber(campaign.clicks)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatNumber(campaign.delivered)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatNumber(campaign.bounces)}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatNumber(campaign.unsubscribes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.totalCampaigns > 10 && (
          <p className="text-sm text-gray-500 mt-2">
            Showing top 10 campaigns out of {data.totalCampaigns} total campaigns
          </p>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 page-break">
        <h2 className="text-lg font-bold mb-4">Period Summary</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Requests:</span>
                <span className="text-sm font-medium">{formatNumber(data.metrics.current.totalRequests)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Delivered:</span>
                <span className="text-sm font-medium">{formatNumber(data.metrics.current.totalDelivered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery Rate:</span>
                <span className="text-sm font-medium">
                  {((data.metrics.current.totalDelivered / data.metrics.current.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previous Year</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Requests:</span>
                <span className="text-sm font-medium">{formatNumber(data.metrics.previousYear.totalRequests)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Delivered:</span>
                <span className="text-sm font-medium">{formatNumber(data.metrics.previousYear.totalDelivered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery Rate:</span>
                <span className="text-sm font-medium">
                  {((data.metrics.previousYear.totalDelivered / data.metrics.previousYear.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 