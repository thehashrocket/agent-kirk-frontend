import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PaidSearchPerformanceChartProps } from './types';

export function PaidSearchPerformanceChart({ data, isLoading = false }: PaidSearchPerformanceChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Performance over time comparison
          </p>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Group data by date and aggregate metrics
  const chartData = data.reduce((acc, item) => {
    const existingEntry = acc.find(entry => entry.date === item.date);
    
    if (existingEntry) {
      existingEntry.impressions += item.impressions;
      existingEntry.clicks += item.clicks;
      existingEntry.conversions += item.conversions;
      existingEntry.spend += item.spend;
    } else {
      acc.push({
        date: item.date,
        impressions: item.impressions,
        clicks: item.clicks,
        conversions: item.conversions,
        spend: item.spend
      });
    }
    
    return acc;
  }, [] as Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>);

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatCurrency = (value: number) => `$${value.toFixed(0)}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey === 'spend' 
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Performance over time comparison
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Impressions"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Clicks"
                  dot={{ fill: '#10b981', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Conversions"
                  dot={{ fill: '#f59e0b', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Spend ($)"
                  dot={{ fill: '#ef4444', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No performance data available
          </div>
        )}
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Impressions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Clicks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Conversions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Spend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 