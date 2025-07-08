'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * @component SproutSocialDemographicsChart
 * @path src/components/channels/sprout-social/components/sprout-social-demographics-chart.tsx
 * 
 * Liskov Substitution Principle: Can be substituted for other chart components
 * Single Responsibility: Focused on demographic data visualization
 * 
 * Features:
 * - Displays follower demographics in bar chart format
 * - Supports age, gender, location breakdowns
 * - Configurable color schemes and data formatting
 * - Responsive design with custom tooltips
 */

export interface DemographicData {
  category: string;
  value: number;
  percentage?: number;
}

export interface DemographicsChartConfig {
  title: string;
  subtitle?: string;
  colors: string[];
  valueFormatter?: (value: number) => string;
  orientation?: 'horizontal' | 'vertical';
  height?: number;
}

interface SproutSocialDemographicsChartProps {
  data: DemographicData[];
  config: DemographicsChartConfig;
}

// Default color schemes for different demographic types
const defaultColorSchemes = {
  age: ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  gender: ['#3b82f6', '#ec4899', '#8b5cf6'],
  location: [
    '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
    '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'
  ],
};

export function SproutSocialDemographicsChart({ 
  data, 
  config 
}: SproutSocialDemographicsChartProps) {
  
  // Calculate percentages if not provided
  const processedData = React.useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return data.map((item, index) => ({
      ...item,
      percentage: item.percentage || (total > 0 ? (item.value / total) * 100 : 0),
      color: config.colors[index % config.colors.length],
    }));
  }, [data, config.colors]);

  const formatter = config.valueFormatter || ((value: number) => value.toLocaleString());
  const isHorizontal = config.orientation === 'horizontal';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="font-medium">{data.category}</p>
        <p className="text-sm text-blue-600">
          Count: {formatter(data.value)}
        </p>
        <p className="text-sm text-gray-600">
          {data.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  };

  // Custom label component for displaying values on bars
  const CustomLabel = ({ x, y, width, height, value, percentage }: any) => {
    const labelX = isHorizontal ? x + width + 5 : x + width / 2;
    const labelY = isHorizontal ? y + height / 2 : y - 5;
    
    return (
      <text
        x={labelX}
        y={labelY}
        textAnchor={isHorizontal ? 'start' : 'middle'}
        dominantBaseline={isHorizontal ? 'middle' : 'auto'}
        fontSize="12"
        fill="#374151"
        fontWeight="500"
      >
        {formatter(value)}
      </text>
    );
  };

  if (!processedData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          {config.subtitle && (
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No demographic data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = (
    <ResponsiveContainer width="100%" height={config.height || 300}>
      <BarChart
        data={processedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        
        {isHorizontal ? (
          <>
            <XAxis type="number" tickFormatter={formatter} />
            <YAxis type="category" dataKey="category" width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey="category" />
            <YAxis tickFormatter={formatter} />
          </>
        )}
        
        <Tooltip content={<CustomTooltip />} />
        
        <Bar 
          dataKey="value" 
          radius={4}
          label={<CustomLabel />}
        >
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        {config.subtitle && (
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height: config.height || 300 }}>
          {ChartComponent}
        </div>
      </CardContent>
    </Card>
  );
}

// Factory functions for creating demographic chart configs
export const createDemographicsConfig = {
  age: (data: DemographicData[]): DemographicsChartConfig => ({
    title: 'Followers',
    subtitle: 'By Age & Gender',
    colors: defaultColorSchemes.age,
    orientation: 'horizontal',
    height: 300,
  }),
  
  gender: (data: DemographicData[]): DemographicsChartConfig => ({
    title: 'Followers by Gender',
    subtitle: 'Gender distribution of followers',
    colors: defaultColorSchemes.gender,
    orientation: 'vertical',
    height: 250,
  }),
  
  location: (data: DemographicData[]): DemographicsChartConfig => ({
    title: 'Followers',
    subtitle: 'By City',
    colors: defaultColorSchemes.location,
    orientation: 'horizontal',
    height: 400,
  }),
};

// Utility function to transform raw data into demographic format
export const transformDemographicData = {
  fromAgeGroups: (ageData: Record<string, number>): DemographicData[] => {
    return Object.entries(ageData).map(([age, count]) => ({
      category: age,
      value: count,
    }));
  },
  
  fromGenderData: (genderData: Record<string, number>): DemographicData[] => {
    return Object.entries(genderData).map(([gender, count]) => ({
      category: gender,
      value: count,
    }));
  },
  
  fromLocationData: (locationData: Record<string, number>): DemographicData[] => {
    return Object.entries(locationData)
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .slice(0, 10) // Take top 10
      .map(([location, count]) => ({
        category: location,
        value: count,
      }));
  },
}; 