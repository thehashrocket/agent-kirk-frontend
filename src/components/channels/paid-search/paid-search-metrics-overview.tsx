import React from 'react';
import { MetricCard } from '@/components/ui/metric-card';
import { Eye, MousePointer, DollarSign, Phone, Target, TrendingUp, CreditCard } from 'lucide-react';
import type { PaidSearchMetricsOverviewProps } from './types';

export function PaidSearchMetricsOverview({ campaignOverview, isLoading = false }: PaidSearchMetricsOverviewProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Calculate totals from campaign overview data
  const totals = campaignOverview.reduce((acc, campaign) => ({
    impressions: acc.impressions + campaign.impressions,
    clicks: acc.clicks + campaign.clicks,
    conversions: acc.conversions + campaign.conversions,
    phoneCalls: acc.phoneCalls + campaign.phoneCalls,
    totalSpend: acc.totalSpend + campaign.totalSpend,
  }), {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    phoneCalls: 0,
    totalSpend: 0,
  });

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpc = totals.clicks > 0 ? totals.totalSpend / totals.clicks : 0;

  const metricsData = [
    {
      title: 'Impressions',
      value: formatNumber(totals.impressions),
      icon: <Eye className="h-5 w-5" />,
      variant: 'primary' as const
    },
    {
      title: 'Clicks',
      value: formatNumber(totals.clicks),
      icon: <MousePointer className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'CTR',
      value: formatPercentage(avgCtr),
      subtitle: `${formatNumber(totals.clicks)} of ${formatNumber(totals.impressions)}`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'secondary' as const
    },
    {
      title: 'Avg CPC',
      value: formatCurrency(avgCpc),
      icon: <CreditCard className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Conversions',
      value: formatNumber(totals.conversions),
      icon: <Target className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Phone Calls',
      value: formatNumber(totals.phoneCalls),
      icon: <Phone className="h-5 w-5" />,
      variant: 'default' as const
    },
    {
      title: 'Total Spend',
      value: formatCurrency(totals.totalSpend),
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'default' as const
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Campaign Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          {campaignOverview.length > 0 && `${campaignOverview[0].period} Comparison`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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

      {/* Year-over-year breakdown */}
      {campaignOverview.length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="text-md font-medium">Year-over-Year Breakdown</h3>
          <div className="space-y-2">
            {campaignOverview.map((campaign) => (
              <div key={campaign.year} className="p-4 border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Kickaroos Ads - {campaign.year}</h4>
                  <span className="text-sm text-muted-foreground">{campaign.period}</span>
                </div>
                <div className="grid grid-cols-7 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Impressions</p>
                    <p className="font-mono">{formatNumber(campaign.impressions)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Clicks</p>
                    <p className="font-mono">{formatNumber(campaign.clicks)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">CTR</p>
                    <p className="font-mono">{formatPercentage(campaign.ctr)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Avg CPC</p>
                    <p className="font-mono">{formatCurrency(campaign.avgCpc)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Conversions</p>
                    <p className="font-mono">{formatNumber(campaign.conversions)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Phone Calls</p>
                    <p className="font-mono">{formatNumber(campaign.phoneCalls)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Total Spend</p>
                    <p className="font-mono">{formatCurrency(campaign.totalSpend)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 