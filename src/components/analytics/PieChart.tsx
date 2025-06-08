'use client';

import { PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface RawData {
  id: string;
  date: string;
  channelGroup?: string;
  trafficSource?: string;
  sessions: number;
}

interface PieChartProps {
  data: RawData[];
  dateRange: { from: Date; to: Date } | null;
  type: 'channel' | 'source';
}

// Color maps for different chart types
const colorMaps = {
  channel: {
    'Direct': '#e69832',
    'Organic Search': '#1a3766',
    'Email': '#6b6e6e',
    'Referral': '#a6b6c6',
    'Organic Social': '#4a90e2',
    'Unassigned': '#cccccc',
  } as const,
  source: [
    '#e69832', // (direct)
    '#2176d2', // google
    '#1a3766', // 1905 Media Full List
    '#6b6e6e', // gmb
    '#8bc34a', // giantthatwork...
    '#a6b6c6', // bing
    '#b94e8a', // Unknown List
    '#e94e32', // instagram
    '#bdb76b', // 4238 Zfevb Ahyy Yvfg
    '#444444', // Others
  ]
} as const;

/**
 * src/components/analytics/PieChart.tsx
 *
 * PieChart React component for rendering a customizable pie chart using recharts.
 *
 * - Displays a pie chart with a custom legend and tooltip.
 * - Accepts data with name, value, and color for each slice.
 * - Follows accessibility and styling best practices (semantic HTML, ARIA, Tailwind CSS).
 *
 * @component
 * @example
 * // Example usage:
 * import { PieChart, PieChartData } from '@/components/analytics/PieChart';
 *
 * const data: PieChartData[] = [
 *   { name: 'Category A', value: 400, color: '#6366f1' },
 *   { name: 'Category B', value: 300, color: '#f59e42' },
 *   { name: 'Category C', value: 300, color: '#10b981' },
 * ];
 *
 * <PieChart data={data} />
 *
 * @prop {PieChartData[]} data - Array of data objects for each pie slice.
 *
 * PieChartData shape:
 *   - name: string (label for the slice)
 *   - value: number (numeric value for the slice)
 *   - color: string (hex or CSS color for the slice)
 *
 * Accessibility:
 * - Uses semantic HTML and ARIA attributes where possible.
 * - Custom legend is keyboard accessible.
 * - Tooltip provides additional context for screen readers.
 */

// Custom legend renderer to match screenshot style
function renderLegend({ payload, data }: any) {
  // Use the data prop for total and for each value
  const total = data.reduce((sum: number, entry: any) => sum + entry.value, 0);
  return (
    <ul className="space-y-3 ml-12">
      {payload.map((entry: any, index: number) => {
        // Find the value from the data array by name
        const dataItem = data.find((d: any) => d.name === entry.payload.name);
        const value = dataItem ? dataItem.value : 0;
        const percent = total > 0 ? (value / total) * 100 : 0;
        return (
          <li key={`item-${index}`} className="flex items-center gap-2 text-xs text-gray-900">
            {/* Color indicator for each legend item */}
            <span
              className="inline-block w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-sm text-gray-900">{entry.payload.name}</span>
            <span className="text-xs font-semibold" style={{ color: entry.color }}>{percent.toFixed(1)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export const PieChart: React.FC<PieChartProps> = ({ data, type, dateRange }) => {
  // Transform raw data into pie chart format
  const pieData = React.useMemo(() => {
    // Filter data by date range first
    const filteredData = dateRange 
      ? data.filter(row => {
          const rowDate = new Date(row.date);
          return rowDate >= dateRange.from && rowDate <= dateRange.to;
        })
      : data;

    // Aggregate data by channel or source
    const aggregatedData: Record<string, number> = {};
    
    filteredData.forEach((row) => {
      const key = type === 'channel' ? row.channelGroup || 'Unknown' : row.trafficSource || 'Unknown';
      aggregatedData[key] = (aggregatedData[key] || 0) + row.sessions;
    });

    if (type === 'channel') {
      // For channels, use the color map directly
      return Object.entries(aggregatedData)
        .map(([name, value]) => ({
          name,
          value,
          color: (colorMaps.channel as Record<string, string>)[name] || '#ccc',
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // For sources, handle grouping of small sources
      let entries = Object.entries(aggregatedData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      const total = entries.reduce((sum, e) => sum + e.value, 0);
      
      // Group small sources into 'Others' (less than 5% or after top 7)
      const mainSources = entries.filter((e, i) => i < 7 && e.value / total >= 0.05);
      const others = entries.filter((e, i) => !(i < 7 && e.value / total >= 0.05));
      const othersValue = others.reduce((sum, e) => sum + e.value, 0);
      
      let colorIdx = 0;
      const pieData = mainSources.map((e) => ({
        name: e.name,
        value: e.value,
        color: colorMaps.source[colorIdx++] || '#ccc',
      }));
      
      if (othersValue > 0) {
        pieData.push({ name: 'Others', value: othersValue, color: '#444444' });
      }
      
      return pieData;
    }
  }, [data, type, dateRange]);

  // Calculate total for legend and tooltip percentage
  const total = pieData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-[460px] min-h-[260px]" style={{ aspectRatio: '460/260' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            {/* Main Pie chart rendering */}
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              isAnimationActive={true}
            >
              {/* Render each slice with its color */}
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            {/* Tooltip shows value and percent */}
            <Tooltip
              formatter={(value: any, name: any, props: any) => {
                const percent = total > 0 ? ((value as number) / total) * 100 : 0;
                return [
                  `${value.toLocaleString()} (${percent.toFixed(1)}%)`,
                  props.payload.name,
                ];
              }}
            />
            {/* Custom legend rendered at right */}
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              content={props => renderLegend({ ...props, data: pieData })}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 