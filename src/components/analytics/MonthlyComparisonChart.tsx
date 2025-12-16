'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface MonthlySessionData {
  month: number; // YYYYMM format
  sessions: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlySessionData[];
  height?: number;
}

// Create a unique key for data point tracking
function getDataKey(item: any): string {
  return `${item.monthNum || 'unknown'}|${item.sessions || 0}|${item.prevYearSessions || 0}`;
}

// Custom label component for displaying values on data points
const CustomLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fontSize="12"
      fill="#374151"
      fontWeight="500"
    >
      {value?.toLocaleString()}
    </text>
  );
};

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  height = 400
}) => {
  const instanceId = useId();
  // Track accumulated data to handle multiple renders
  const [accumulatedData, setAccumulatedData] = useState<MonthlySessionData[]>([]);

  // Accumulate data across renders
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Add new data to accumulated state
    setAccumulatedData(prevData => {
      // If no previous data, just use current data
      if (prevData.length === 0) return data;

      // Create a set of existing month values to avoid duplicates
      const existingMonths = new Set(prevData.map(item => item.month));

      // Get only new items
      const newItems = data.filter(item => !existingMonths.has(item.month));

      // Return combined array if we have new items
      return newItems.length > 0 ? [...prevData, ...newItems] : prevData;
    });

    return () => {
      // Cleanup
    };
  }, [data]);

  // Process data to create chart-friendly format with current and previous year
  const processedData = React.useMemo(() => {
    // Use accumulated data if available, otherwise use the current data
    const dataToProcess = accumulatedData.length > 0 ? accumulatedData : data;

    if (!dataToProcess || dataToProcess.length === 0) return [];

    // Log the raw data to understand what we're working with
    // console.log("MonthlyComparisonChart - Raw data:", dataToProcess.map(d => ({
    //   month: d.month,
    //   year: Math.floor(d.month / 100),
    //   monthDigit: d.month % 100,
    //   sessions: d.sessions
    // })));

    // Create a lookup map for sessions by month
    const sessionsByMonth = new Map<number, number>();
    dataToProcess.forEach(item => {
      sessionsByMonth.set(item.month, item.sessions);
    });

    // Get all available months sorted in descending order (most recent first)
    const allDataMonths = [...dataToProcess.map(item => item.month)].sort((a, b) => b - a);
    // console.log("MonthlyComparisonChart - Available months in data:", allDataMonths);

    // Get a list of all unique years in the data
    const years = new Set<number>();
    dataToProcess.forEach(item => {
      const year = Math.floor(item.month / 100);
      years.add(year);
    });
    const availableYears = Array.from(years).sort((a, b) => b - a); // Descending order
    // console.log("MonthlyComparisonChart - Available years:", availableYears);

    // Extract the most recent year that has data
    const mostRecentYear = availableYears[0];

    // Get months from the most recent year for reference
    const recentYearMonths = allDataMonths
      .filter(month => Math.floor(month / 100) === mostRecentYear)
      .sort((a, b) => a - b);

    // console.log("MonthlyComparisonChart - Months for most recent year:", recentYearMonths);

    // Get the 12 most recent months regardless of year
    // This ensures we show the last 12 calendar months
    const last12Months = allDataMonths.slice(0, 12).sort((a, b) => a - b);

    // If we have fewer than 12 months, use what we have
    const monthsToShow = last12Months.length > 0 ? last12Months : allDataMonths;

    // console.log("MonthlyComparisonChart - Last 12 months to show:", monthsToShow);

    // Prepare chart data with proper typing
    const result: Array<{
      monthNum: number;
      month: string;
      sessions: number;
      prevYearSessions: number;
    }> = [];

    // Process each month that we want to show
    monthsToShow.forEach(yearMonth => {
      const year = Math.floor(yearMonth / 100);
      const month = yearMonth % 100;

      // Get sessions for current year/month
      const sessions = sessionsByMonth.get(yearMonth) || 0;

      // Calculate previous year's equivalent month
      const prevYearMonth = (year - 1) * 100 + month;
      const prevYearSessions = sessionsByMonth.get(prevYearMonth) || 0;

      // Format month for display
      // Need to subtract 1 from month because JavaScript months are 0-indexed
      const date = new Date(year, month - 1, 1);
      const displayMonth = date.toLocaleString('en-US', { month: 'long' });

      // Add to chart data
      result.push({
        monthNum: yearMonth,
        month: `${displayMonth} ${year}`,
        sessions: sessions,
        prevYearSessions: prevYearSessions
      });
    });

    // Sort result by month number to ensure chronological order
    result.sort((a, b) => a.monthNum - b.monthNum);

    // Log the final chart data
    // console.log("MonthlyComparisonChart - Final chart data:", result);

    return result;
  }, [accumulatedData, data]);

  // Format large numbers (e.g., 4000 -> 4K)
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return value.toString();
  };

  // Custom formatter for the tooltip values - simplified to show only values
  const valueFormatter = (value: number | undefined, name: string | undefined) => {
    if (value === undefined) return ['', ''];
    const safeName = name || '';
    const prefix = safeName.includes('previous') ? 'Previous: ' : 'Current: ';
    return [value.toLocaleString(), prefix];
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400">No data available for monthly comparison</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-1 bg-blue-700 mr-1"></span>
          <span className="text-sm text-gray-600">Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-1 bg-blue-200 mr-1"></span>
          <span className="text-sm text-gray-600">Sessions (previous year)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={processedData}
          margin={{ top: 50, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatValue(value)}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={valueFormatter}
            labelFormatter={() => ''}
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
            stroke="#01518e"
            strokeWidth={2}
            name="Sessions"
            dot={{ r: 4, fill: '#01518e', stroke: 'white', strokeWidth: 1 }}
            activeDot={{ r: 6, fill: '#1a3766', stroke: 'white', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
          >
            <LabelList content={CustomLabel} />
          </Line>
          <Line
            type="monotone"
            dataKey="prevYearSessions"
            stroke="#a6c8ff"
            strokeWidth={2}
            name="Sessions (previous year)"
            dot={{ r: 4, fill: '#a6c8ff', stroke: 'white', strokeWidth: 1 }}
            activeDot={{ r: 6, fill: '#a6c8ff', stroke: 'white', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
            animationBegin={300}
          >
            <LabelList content={CustomLabel} />
          </Line>
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};