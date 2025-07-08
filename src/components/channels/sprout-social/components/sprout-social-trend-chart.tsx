'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SproutSocialAnalytics } from '../types';

/**
 * @component SproutSocialTrendChart
 * @path src/components/channels/sprout-social/components/sprout-social-trend-chart.tsx
 * 
 * Open/Closed Principle: Open for extension (new chart types) but closed for modification
 * Interface Segregation: Focused interface for trend visualization
 * 
 * Features:
 * - Generic trend visualization for any numeric metric
 * - Supports current vs comparison period display
 * - Configurable chart appearance and formatting
 * - Responsive design with proper tooltips
 */

export interface TrendChartConfig {
  title: string;
  description: string;
  dataKey: string;
  color: string;
  comparisonColor: string;
  yAxisLabel?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

interface SproutSocialTrendChartProps {
  data: SproutSocialAnalytics[];
  comparisonData: SproutSocialAnalytics[];
  config: TrendChartConfig;
  dateRange: { start: string; end: string };
}

interface ChartDataPoint {
  date: string;
  currentValue: number;
  comparisonValue: number;
  displayDate: string;
}

// Default formatters following Dependency Inversion Principle
const defaultFormatters = {
  number: (value: number) => value.toLocaleString(),
  percentage: (value: number) => `${value.toFixed(2)}%`,
  currency: (value: number) => `$${value.toFixed(2)}`,
} as const;

export function SproutSocialTrendChart({ 
  data, 
  comparisonData, 
  config, 
  dateRange 
}: SproutSocialTrendChartProps) {
  
  // Process data for chart display
  const processData = (): ChartDataPoint[] => {
    const chartData: ChartDataPoint[] = [];
    

    
    // Create a map of comparison data by date for efficient lookup
    const comparisonMap = new Map<string, number>();
    comparisonData.forEach(item => {
      const dateKey = item.reportingDate.split('T')[0];
      const value = (item as any)[config.dataKey] || 0;
      comparisonMap.set(dateKey, value);
    });
    
    // Process current period data
    data.forEach(item => {
      const dateKey = item.reportingDate.split('T')[0];
      const currentValue = (item as any)[config.dataKey] || 0;
      const comparisonValue = comparisonMap.get(dateKey) || 0;
      

      
      chartData.push({
        date: dateKey,
        currentValue,
        comparisonValue,
        displayDate: format(parseISO(dateKey), 'MMM d'),
      });
    });
    
    // Sort by date
    const sortedData = chartData.sort((a, b) => a.date.localeCompare(b.date));
    
    return sortedData;
  };

  const chartData = processData();
  const formatter = config.valueFormatter || defaultFormatters.number;

  // Handle empty data case
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No data available for {config.title}</p>
              <p className="text-xs mt-2">Data length: {data.length}, Comparison length: {comparisonData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate that we have actual data values
  const hasValidData = chartData.some(d => d.currentValue > 0 || d.comparisonValue > 0);
  if (!hasValidData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p>No valid data values for {config.title}</p>
              <p className="text-xs mt-2">Data key: {config.dataKey}</p>
              <p className="text-xs">Sample values: {chartData.slice(0, 3).map(d => `${d.currentValue}/${d.comparisonValue}`).join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatter(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  // Calculate max value for Y-axis domain
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.currentValue, d.comparisonValue))
  );
  
  // For small values, ensure we have a reasonable scale
  let yAxisMax: number;
  if (maxValue === 0) {
    yAxisMax = 10; // Default scale for zero values
  } else if (maxValue < 10) {
    yAxisMax = Math.max(10, maxValue * 2); // At least 10, or double the max for small values
  } else {
    yAxisMax = Math.ceil(maxValue * 1.1); // Normal 10% padding
  }



  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        <p className="text-xs text-muted-foreground">
          {format(parseISO(dateRange.start), 'MMM d, yyyy')} - {format(parseISO(dateRange.end), 'MMM d, yyyy')}
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span>Total: {formatter(chartData.reduce((sum, d) => sum + d.currentValue, 0))}</span>
          <span>Max: {formatter(maxValue)}</span>
          <span>Data Points: {chartData.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: config.height || 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, yAxisMax]}
                tickFormatter={formatter}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                ticks={maxValue < 10 ? [0, Math.ceil(maxValue/2), maxValue] : undefined}
                label={{ 
                  value: config.yAxisLabel || config.title, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Line
                type="monotone"
                dataKey="currentValue"
                name={`Current Period`}
                stroke={config.color}
                strokeWidth={3}
                dot={{ r: 4, fill: config.color, stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
              />
              
              <Line
                type="monotone"
                dataKey="comparisonValue"
                name="Previous Period"
                stroke={config.comparisonColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: config.comparisonColor, stroke: 'white', strokeWidth: 1 }}
                activeDot={{ r: 5, stroke: 'white', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Factory function for creating chart configs (following Factory Pattern)
export const createChartConfig = {
  reach: (): TrendChartConfig => ({
    title: 'Total Reach',
    description: 'Total impressions over time with year-over-year comparison',
    dataKey: 'impressions',
    color: '#3b82f6',
    comparisonColor: '#93c5fd',
    yAxisLabel: 'Impressions',
    valueFormatter: defaultFormatters.number,
  }),
  
  engagement: (): TrendChartConfig => ({
    title: 'Total Engagement', 
    description: 'Engagement metrics over time comparison',
    dataKey: 'engagements',
    color: '#10b981',
    comparisonColor: '#86efac',
    yAxisLabel: 'Engagements',
    valueFormatter: defaultFormatters.number,
  }),
  
  followers: (): TrendChartConfig => ({
    title: 'Followers Growth',
    description: 'Follower count changes over time',
    dataKey: 'followersCount', 
    color: '#8b5cf6',
    comparisonColor: '#c4b5fd',
    yAxisLabel: 'Followers',
    valueFormatter: defaultFormatters.number,
  }),
  
  videoViews: (): TrendChartConfig => ({
    title: 'Video Views',
    description: 'Video view performance over time', 
    dataKey: 'videoViews',
    color: '#f59e0b',
    comparisonColor: '#fbbf24',
    yAxisLabel: 'Views',
    valueFormatter: defaultFormatters.number,
  }),
}; 