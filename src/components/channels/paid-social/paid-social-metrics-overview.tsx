import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { Users, Eye, Heart, MousePointer, TrendingUp, DollarSign, Target, CreditCard } from 'lucide-react';
import type { PaidSocialMetricsOverviewProps } from './types';

export function PaidSocialMetricsOverview({ metrics, isLoading = false }: PaidSocialMetricsOverviewProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const metricsData = [
    {
      title: 'Reach',
      value: metrics ? formatNumber(metrics.reach) : '0',
      icon: <Users className="h-5 w-5" />,
      variant: 'primary' as const
    },
    {
      title: 'Impressions',
      value: metrics ? formatNumber(metrics.impressions) : '0',
      icon: <Eye className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Engagement',
      value: metrics ? formatNumber(metrics.engagement) : '0',
      icon: <Heart className="h-5 w-5" />,
      variant: 'secondary' as const
    },
    {
      title: 'Link Clicks',
      value: metrics ? formatNumber(metrics.linkClicks) : '0',
      icon: <MousePointer className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Link CTR%',
      value: metrics ? formatPercentage(metrics.linkCtr) : '0%',
      subtitle: `${metrics ? formatNumber(metrics.linkClicks) : '0'} of ${metrics ? formatNumber(metrics.impressions) : '0'}`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Cost / Link Click',
      value: metrics ? formatCurrency(metrics.costPerLinkClick) : '$0.00',
      icon: <CreditCard className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'LPVs',
      value: metrics ? formatNumber(metrics.lpvs) : '0',
      icon: <Target className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Cost / LPV',
      value: metrics ? formatCurrency(metrics.costPerLpv) : '$0.00',
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Amount Spent',
      value: metrics ? formatCurrency(metrics.amountSpent) : '$0.00',
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaign Stats Overview
        </h2>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <span>Campaign Name</span>
            <select className="border rounded px-2 py-1 text-xs bg-background">
              <option>All Campaigns</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span>Ad Set</span>
            <select className="border rounded px-2 py-1 text-xs bg-background">
              <option>All Ad Sets</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span>Ad Name</span>
            <select className="border rounded px-2 py-1 text-xs bg-background">
              <option>All Ads</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
        {metricsData.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            variant={metric.variant}
            isLoading={isLoading}
            className="min-h-[120px]"
          />
        ))}
      </div>
    </div>
  );
} 