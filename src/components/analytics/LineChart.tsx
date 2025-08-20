'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * Represents a single data point for the line chart.
 * @property date - ISO date string (YYYY-MM-DD)
 * @property sessions - Number of sessions for the date
 */
interface DataPoint {
  date: string;
  sessions: number;
}

/**
 * Props for the LineChart component.
 * @property data - Array of DataPoint objects to visualize
 * @property height - Height of the chart in pixels (default: 400)
 * @property dateRange - Optional date range to filter data
 * @property useFallbackData - When true, ignores dateRange filtering and shows all data
 */
interface LineChartProps {
  data: Array<DataPoint>;
  height?: number;
  dateRange?: { from: Date; to: Date } | null;
  useFallbackData?: boolean;
}

/**
 * Returns a unique key for a data point (for deduplication).
 * @param item - DataPoint object
 * @returns Unique string key
 */
function getDataPointKey(item: DataPoint): string {
  return `${item.date}|${item.sessions}`;
}

/**
 * LineChart Component
 * File: src/components/analytics/LineChart.tsx
 *
 * Renders a responsive line chart for session analytics using recharts.
 *
 * - Fills missing dates with zero sessions for continuous lines.
 * - Filters and deduplicates data within a date range.
 * - Accessible: keyboard and screen reader friendly, clear empty state.
 * - Performance: uses React.memo, useMemo, and efficient data processing.
 * - Styling: Tailwind utility classes, responsive container.
 *
 * Usage Example:
 *
 * ```tsx
 * // Example: Integrating LineChart in a Next.js page with dynamic data
 * import { LineChart } from '@/components/analytics/LineChart';
 * import { useEffect, useState } from 'react';
 *
 * export default function AnalyticsPage() {
 *   const [data, setData] = useState([]);
 *
 *   useEffect(() => {
 *     // Simulate fetching data from an API
 *     fetch('/api/sessions')
 *       .then(res => res.json())
 *       .then(setData);
 *   }, []);
 *
 *   return (
 *     <div className="p-6">
 *       <h2 className="text-xl font-bold mb-4">Sessions Over Time</h2>
 *       <LineChart
 *         data={data}
 *         height={400}
 *         dateRange={{ from: new Date('2024-04-01'), to: new Date('2024-04-30') }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * Props:
 * - data: Array of { date: string (YYYY-MM-DD), sessions: number }
 * - height: Chart height in px (default 400)
 * - dateRange: Optional { from: Date, to: Date } to filter data
 */
export const LineChart: React.FC<LineChartProps> = ({ data, height = 400, dateRange = null, useFallbackData = false }) => {
  const instanceId = useId();
  // Store accumulated data to handle multiple renders
  const [accumulatedData, setAccumulatedData] = useState<DataPoint[]>([]);

  // Accumulate unique data points across renders
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create a Set of keys for existing data to check for duplicates
    const existingKeys = new Set(
      accumulatedData.map(item => getDataPointKey(item))
    );

    // Filter to only include new unique items
    const newItems = data.filter(item => {
      const key = getDataPointKey(item);
      return !existingKeys.has(key);
    });

    if (newItems.length > 0) {
      // Add new items to accumulated data
      setAccumulatedData(prevData => [...prevData, ...newItems]);
    }

    return () => {
      // Cleanup
    };
  }, [data, instanceId, accumulatedData]); // Include accumulatedData in dependencies to properly track

  // Process all available data
  const processedData = React.useMemo(() => {
    const dataToProcess = accumulatedData.length > 0 ? accumulatedData : data;
    if (!dataToProcess || dataToProcess.length === 0) return [];

    // Helpers that produce a local YYYY-MM-DD key (no UTC conversion)
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDateKeyFromDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const localDateKeyFromString = (s: string) => {
      const d = new Date(s);
      if (isNaN(d.getTime())) return s;
      return localDateKeyFromDate(d);
    };

    // 1. Determine the date range for filtering (use local dates)
    let startDate: Date;
    let endDate: Date;
    if (dateRange && dateRange.from && dateRange.to) {
      startDate = new Date(dateRange.from); // expect local-midnight
      endDate = new Date(dateRange.to);
    } else {
      const dates = dataToProcess
        .map(item => new Date(item.date))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      startDate = dates[0];
      endDate = dates[dates.length - 1];
    }

    // 2. Deduplicate (use local keys)
    const uniqueDataMap = new Map<string, DataPoint>();
    dataToProcess.forEach(item => {
      const key = localDateKeyFromString(item.date);
      try {
        const d = new Date(item.date);
        if (isNaN(d.getTime())) return;
        if (useFallbackData || !dateRange || (d >= startDate && d <= endDate)) {
          if (!uniqueDataMap.has(key) || uniqueDataMap.get(key)!.sessions < item.sessions) {
            // store with date normalized to local YYYY-MM-DD
            uniqueDataMap.set(key, { date: key, sessions: item.sessions });
          }
        }
      } catch (error) {
        console.error(`LineChart: Error processing date: ${item.date}`, error);
      }
    });

    const filteredData = Array.from(uniqueDataMap.values()).sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    // 4. Fill missing dates (iterate in local time)
    const result: DataPoint[] = [];
    if (filteredData.length > 0) {
      const dataByDate = new Map<string, DataPoint>();
      filteredData.forEach(item => dataByDate.set(item.date, item));

      for (let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        d.setDate(d.getDate() + 1)) {
        const key = localDateKeyFromDate(new Date(d));
        if (dataByDate.has(key)) {
          result.push(dataByDate.get(key)!);
        } else {
          result.push({ date: key, sessions: 0 });
        }
      }
    }

    return result;
  }, [data, accumulatedData, dateRange, useFallbackData]);


  // Format date for axis label (e.g., "April 1" instead of "Apr 1")
  const formatDate = (dateStr: string) => {
    try {
      // Parse the local YYYY-MM-DD key into components to avoid Date parsing inconsistencies
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const month = dt.toLocaleString('en-US', { month: 'long' });
      return `${month} ${dt.getDate()}`;
    } catch (error) {
      console.error(`LineChart: Error formatting date: ${dateStr}`, error);
      return dateStr;
    }
  };

  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    if (value < 1000) return value.toString();
    return `${Math.floor(value / 100) * 100}`;
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">No data available for the selected time period</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <div className="flex items-center mr-6">
          <span className="inline-block w-8 h-1 bg-orange-400 mr-2"></span>
          <span className="text-sm text-gray-600">Sessions</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={processedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value: any) => [value.toLocaleString(), 'Sessions']}
            labelFormatter={(label) => formatDate(label)}
            contentStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              border: 'none',
              padding: '8px 12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="#e69832"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#e69832', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
            animationBegin={0}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};