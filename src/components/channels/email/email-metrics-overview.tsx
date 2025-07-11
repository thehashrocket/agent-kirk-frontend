import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { Mail, MousePointer, Users, UserX, Zap } from 'lucide-react';
import type { EmailMetricsOverviewProps } from './types';

export function EmailMetricsOverview({ metrics, isLoading = false }: EmailMetricsOverviewProps) {
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  // Defensive: metrics may be undefined, and metrics.metrics may be undefined
  const current = metrics?.metrics?.current;

  const metricsData = [
    {
      title: 'Total Delivered',
      value: current?.totalDelivered || 0,
      icon: <Mail className="h-5 w-5" />, 
      variant: 'primary' as const
    },
    {
      title: 'Total Opens',
      value: current?.totalOpens || 0,
      icon: <Users className="h-5 w-5" />, 
      variant: 'default' as const
    },
    {
      title: 'Avg Open Rate',
      value: current ? formatPercentage((current.averageOpenRate || 0) * 100) : '0%',
      subtitle: `${current?.totalOpens || 0} of ${current?.totalDelivered || 0}`,
      icon: <Zap className="h-5 w-5" />, 
      variant: 'secondary' as const
    },
    {
      title: 'Total Clicks',
      value: current?.totalClicks || 0,
      icon: <MousePointer className="h-5 w-5" />, 
      variant: 'default' as const
    },
    {
      title: 'Avg Click Rate',
      value: current ? formatPercentage((current.averageClickRate || 0) * 100) : '0%',
      subtitle: `${current?.totalClicks || 0} of ${current?.totalOpens || 0}`,
      icon: <MousePointer className="h-5 w-5" />, 
      variant: 'default' as const
    },
    {
      title: 'Total Unsubscribes',
      value: current?.totalUnsubscribes || 0,
      icon: <UserX className="h-5 w-5" />, 
      variant: 'default' as const
    },
    {
      title: 'Total Bounces',
      value: current?.totalBounces || 0,
      icon: <Mail className="h-5 w-5" />, 
      variant: 'default' as const
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaign Performance Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Previous Period Comparison
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {metricsData.map((metric, index) => (
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