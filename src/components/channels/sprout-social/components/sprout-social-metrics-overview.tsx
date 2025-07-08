'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Eye, Heart, MousePointer, Globe } from 'lucide-react';
import type { SproutSocialComputedMetrics } from '../types';

/**
 * @component SproutSocialMetricsOverview
 * @path src/components/channels/sprout-social/components/sprout-social-metrics-overview.tsx
 * 
 * Single Responsibility: Display key performance metrics in a card layout
 * 
 * Features:
 * - Displays 5 key metrics matching Instagram report format
 * - Shows growth indicators with trend icons
 * - Responsive grid layout
 * - Platform-agnostic metric display
 */

interface SproutSocialMetricsOverviewProps {
  currentMetrics: SproutSocialComputedMetrics;
  comparisonMetrics: SproutSocialComputedMetrics;
  platformType: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  formatter?: (value: number) => string;
}

function MetricCard({ title, value, change, icon: Icon, formatter = (v) => v.toLocaleString() }: MetricCardProps) {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = hasChange && change > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(value)}</div>
        {hasChange && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">from previous period</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SproutSocialMetricsOverview({ 
  currentMetrics, 
  comparisonMetrics, 
  platformType 
}: SproutSocialMetricsOverviewProps) {
  
  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number | undefined => {
    if (previous === 0) return current > 0 ? 100 : undefined;
    return ((current - previous) / previous) * 100;
  };

  const metrics = [
    {
      title: 'Total Followers',
      value: Math.round(currentMetrics.averageFollowers),
      change: calculateChange(currentMetrics.averageFollowers, comparisonMetrics.averageFollowers),
      icon: Users,
    },
    {
      title: 'Total Reach',
      value: currentMetrics.totalImpressions,
      change: currentMetrics.impressionGrowth,
      icon: Eye,
    },
    {
      title: 'Engagement',
      value: currentMetrics.totalEngagements,
      change: calculateChange(currentMetrics.totalEngagements, comparisonMetrics.totalEngagements),
      icon: Heart,
    },
    {
      title: 'Total Clicks', 
      value: currentMetrics.totalClicks,
      change: calculateChange(currentMetrics.totalClicks, comparisonMetrics.totalClicks),
      icon: MousePointer,
    },
    {
      title: 'Engagement Rate',
      value: currentMetrics.engagementRate,
      change: calculateChange(currentMetrics.engagementRate, comparisonMetrics.engagementRate),
      icon: TrendingUp,
      formatter: (value: number) => `${value.toFixed(2)}%`,
    },
  ];

  // Add platform-specific metrics
  if (platformType.toLowerCase() === 'facebook' && currentMetrics.totalVideoViews > 0) {
    metrics.splice(4, 0, {
      title: 'Video Views',
      value: currentMetrics.totalVideoViews,
      change: calculateChange(currentMetrics.totalVideoViews, comparisonMetrics.totalVideoViews),
      icon: Globe,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          icon={metric.icon}
          formatter={metric.formatter}
        />
      ))}
    </div>
  );
} 