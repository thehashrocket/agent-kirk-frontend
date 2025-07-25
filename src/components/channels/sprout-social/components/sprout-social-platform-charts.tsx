'use client';

import React from 'react';
import { SproutSocialTrendChart, createChartConfig, type TrendChartConfig } from './sprout-social-trend-chart';
import type { SproutSocialAnalytics, SproutSocialComputedMetrics } from '../types';
import { normalizeNames } from '@/lib/utils/normalize-names';
/**
 * @component SproutSocialPlatformCharts
 * @path src/components/channels/sprout-social/components/sprout-social-platform-charts.tsx
 * 
 * Single Responsibility: Handle platform-specific chart rendering
 * 
 * Features:
 * - Platform-specific chart configurations
 * - Only shows relevant charts for each platform
 * - Proper data validation for platform-specific metrics
 * - Extensible for new platforms
 */

interface SproutSocialPlatformChartsProps {
  data: SproutSocialAnalytics[];
  comparisonData: SproutSocialAnalytics[];
  platformType: string;
  currentMetrics: SproutSocialComputedMetrics;
  dateRange: { from: string; to: string };
}

// Platform-specific chart configurations
const platformChartConfigs = {
  facebook: {
    required: ['reach', 'engagement', 'followers'],
    optional: ['videoViews'],
    conditions: {
      videoViews: (metrics: SproutSocialComputedMetrics) => metrics.totalVideoViews > 0
    }
  },
  instagram: {
    required: ['reach', 'engagement', 'followers'],
    optional: ['videoViews'],
    conditions: {
      videoViews: (metrics: SproutSocialComputedMetrics) => metrics.totalVideoViews > 0
    }
  },
  linkedin: {
    required: ['reach', 'engagement', 'followers'],
    optional: ['clicks'],
    conditions: {
      clicks: (metrics: SproutSocialComputedMetrics) => metrics.totalClicks > 0
    }
  },
  pinterest: {
    required: ['reach', 'engagement', 'followers'],
    optional: ['clicks', 'saves'],
    conditions: {
      clicks: (metrics: SproutSocialComputedMetrics) => metrics.totalClicks > 0,
      saves: (metrics: SproutSocialComputedMetrics) => {
        // Check if saves data exists in the raw data
        return true; // Will be validated in chart config
      }
    }
  }
} as const;

// Platform-specific chart configurations with proper data keys
const createPlatformChartConfig = {
  facebook: {
    reach: () => createChartConfig.reach(),
    engagement: () => createChartConfig.engagement(),
    followers: () => createChartConfig.followers(),
    videoViews: () => createChartConfig.videoViews(),
  },
  instagram: {
    reach: () => createChartConfig.reach(),
    engagement: () => createChartConfig.engagement(),
    followers: () => createChartConfig.followers(),
    videoViews: () => createChartConfig.videoViews(),
  },
  linkedin: {
    reach: () => createChartConfig.reach(),
    engagement: () => createChartConfig.engagement(),
    followers: () => createChartConfig.followers(),
    clicks: (): TrendChartConfig => ({
      title: 'Total Clicks',
      description: 'Click performance over time comparison',
      dataKey: 'clicks',
      color: '#0a66c2',
      comparisonColor: '#4da6ff',
      yAxisLabel: 'Clicks',
      valueFormatter: (value: number) => value.toLocaleString(),
    }),
  },
  pinterest: {
    reach: () => createChartConfig.reach(),
    engagement: () => createChartConfig.engagement(),
    followers: () => createChartConfig.followers(),
    clicks: (): TrendChartConfig => ({
      title: 'Total Clicks',
      description: 'Click performance over time comparison',
      dataKey: 'clicks',
      color: '#e60023',
      comparisonColor: '#ff4d6a',
      yAxisLabel: 'Clicks',
      valueFormatter: (value: number) => value.toLocaleString(),
    }),
    saves: (): TrendChartConfig => ({
      title: 'Total Saves',
      description: 'Save performance over time comparison',
      dataKey: 'saves',
      color: '#e60023',
      comparisonColor: '#ff4d6a',
      yAxisLabel: 'Saves',
      valueFormatter: (value: number) => value.toLocaleString(),
    }),
  },
};

// Normalization function for platformType
function normalizePlatformType(platformType: string): string {
  const map: Record<string, string> = {
    facebook: 'facebook',
    facebook_page: 'facebook',
    instagram: 'instagram',
    instagram_business: 'instagram',
    fb_instagram_account: 'instagram',
    linkedin: 'linkedin',
    linkedin_company: 'linkedin',
    pinterest: 'pinterest',
    pinterest_business: 'pinterest',
    twitter: 'twitter',
    twitter_profile: 'twitter',
  };
  const key = platformType.toLowerCase();
  return map[key] || key;
}

export function SproutSocialPlatformCharts({
  data,
  comparisonData,
  platformType,
  currentMetrics,
  dateRange
}: SproutSocialPlatformChartsProps) {
  // Use normalized platform type
  const normalizedPlatform = normalizePlatformType(platformType) as keyof typeof platformChartConfigs;
  const platformConfig = platformChartConfigs[normalizedPlatform];
  const chartConfigs = createPlatformChartConfig[normalizedPlatform];
  
  if (!platformConfig || !chartConfigs) {
    console.warn(`Unsupported platform type: ${platformType}`);
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Charts not available for {platformType} platform</p>
      </div>
    );
  }

  // Get charts to render based on platform
  const getChartsForPlatform = () => {
    const charts: Array<{ key: string; config: TrendChartConfig; isOptional: boolean }> = [];
    
    switch (normalizedPlatform) {
      case 'facebook':
        charts.push(
          { key: 'reach', config: createChartConfig.reach(), isOptional: false },
          { key: 'engagement', config: createChartConfig.engagement(), isOptional: false },
          { key: 'followers', config: createChartConfig.followers(), isOptional: false }
        );
        if (currentMetrics.totalVideoViews > 0) {
          charts.push({ key: 'videoViews', config: createChartConfig.videoViews(), isOptional: true });
        }
        break;
        
      case 'instagram':
        charts.push(
          { key: 'reach', config: createChartConfig.reach(), isOptional: false },
          { key: 'engagement', config: createChartConfig.engagement(), isOptional: false },
          { key: 'followers', config: createChartConfig.followers(), isOptional: false }
        );
        if (currentMetrics.totalVideoViews > 0) {
          charts.push({ key: 'videoViews', config: createChartConfig.videoViews(), isOptional: true });
        }
        break;
        
      case 'linkedin':
        charts.push(
          { key: 'reach', config: createChartConfig.reach(), isOptional: false },
          { key: 'engagement', config: createChartConfig.engagement(), isOptional: false },
          { key: 'followers', config: createChartConfig.followers(), isOptional: false }
        );
        if (currentMetrics.totalClicks > 0) {
          charts.push({
            key: 'clicks',
            config: {
              title: 'Total Clicks',
              description: 'Click performance over time comparison',
              dataKey: 'clicks',
              color: '#0a66c2',
              comparisonColor: '#4da6ff',
              yAxisLabel: 'Clicks',
              valueFormatter: (value: number) => value.toLocaleString(),
            },
            isOptional: true
          });
        }
        break;
        
      case 'pinterest':
        charts.push(
          { key: 'reach', config: createChartConfig.reach(), isOptional: false },
          { key: 'engagement', config: createChartConfig.engagement(), isOptional: false },
          { key: 'followers', config: createChartConfig.followers(), isOptional: false }
        );
        if (currentMetrics.totalClicks > 0) {
          charts.push({
            key: 'clicks',
            config: {
              title: 'Total Clicks',
              description: 'Click performance over time comparison',
              dataKey: 'clicks',
              color: '#e60023',
              comparisonColor: '#ff4d6a',
              yAxisLabel: 'Clicks',
              valueFormatter: (value: number) => value.toLocaleString(),
            },
            isOptional: true
          });
        }
        // Add saves chart if data exists
        if (data.some(item => 'saves' in item)) {
          charts.push({
            key: 'saves',
            config: {
              title: 'Total Saves',
              description: 'Save performance over time comparison',
              dataKey: 'saves',
              color: '#e60023',
              comparisonColor: '#ff4d6a',
              yAxisLabel: 'Saves',
              valueFormatter: (value: number) => value.toLocaleString(),
            },
            isOptional: true
          });
        }
        break;
        
      default:
        console.warn(`Unsupported platform type: ${platformType}`);
        return [];
    }
    
    return charts;
  };
  
  const chartsToRender = getChartsForPlatform();

  // Validate that data exists for each chart
  const validCharts = chartsToRender.filter(({ config }) => {
    const hasData = data.some(item => (item as any)[config.dataKey] !== undefined);
    if (!hasData) {
      console.warn(`No data found for chart: ${config.title} (dataKey: ${config.dataKey})`);
    }
    return hasData;
  });

  if (validCharts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No chart data available for {normalizeNames(platformType)} platform</p>
        <p className="text-sm mt-2">Available data keys: {Object.keys(data[0] || {}).join(', ')}</p>
      </div>
    );
  }

  // Render charts in a responsive grid
  const renderCharts = () => {
    const requiredCharts = validCharts.filter(chart => !chart.isOptional);
    const optionalCharts = validCharts.filter(chart => chart.isOptional);
    
    return (
      <div className="space-y-6">
        {/* Required Charts */}
        {requiredCharts.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {requiredCharts.map(({ key, config }) => (
              <SproutSocialTrendChart
                key={key}
                data={data}
                comparisonData={comparisonData}
                config={config}
                dateRange={dateRange}
              />
            ))}
          </div>
        )}
        
        {/* Optional Charts */}
        {optionalCharts.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {optionalCharts.map(({ key, config }) => (
              <SproutSocialTrendChart
                key={key}
                data={data}
                comparisonData={comparisonData}
                config={config}
                dateRange={dateRange}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderCharts()}
    </div>
  );
}

// Utility function to get platform-specific color scheme
export const getPlatformColors = (platformType: string) => {
  const colors = {
    facebook: { primary: '#1877f2', secondary: '#42a5f5' },
    instagram: { primary: '#e4405f', secondary: '#f06292' },
    linkedin: { primary: '#0a66c2', secondary: '#4da6ff' },
    pinterest: { primary: '#e60023', secondary: '#ff4d6a' },
    twitter: { primary: '#1da1f2', secondary: '#64b5f6' },
  };
  
  return colors[platformType.toLowerCase() as keyof typeof colors] || colors.facebook;
}; 