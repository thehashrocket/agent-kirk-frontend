'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { GaChannelSessionsTable } from './GaChannelSessionsTable';
import { PieChart, PieChartData } from './PieChart';
import { LineChart } from './LineChart';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { MonthRangePicker } from './MonthRangePicker';
import React from 'react';
import { format } from 'date-fns';
import { GaKpiSummaryGrid } from './GaKpiSummaryGrid';

/**
 * GaMetricsGrid Component
 *
 * File: src/components/analytics/GaMetricsGrid.tsx
 *
 * Purpose:
 *   - Displays a comprehensive analytics dashboard for Google Analytics metrics.
 *   - Supports dynamic date range selection and displays KPIs, channel/source breakdowns, and trend charts.
 *   - Aggregates and visualizes data using cards, pie charts, line charts, and tables.
 *   - Follows modern React/Next.js best practices for modularity, accessibility, and performance.
 *
 * Usage:
 *   <GaMetricsGrid data={gaMetricsData} onDateRangeChange={fetchNewData} />
 *
 * Props:
 *   - data: Initial analytics data to display (see GaMetricsResponse type)
 *   - onDateRangeChange: Optional async callback to fetch new data when the date range changes
 *
 * See also:
 *   - src/lib/types/ga-metrics.ts for data types
 *   - src/components/analytics/MonthRangePicker for date selection
 *   - src/components/analytics/PieChart, LineChart, MonthlyComparisonChart for visualizations
 */

/**
 * Props for GaMetricsGrid
 * @property {GaMetricsResponse} data - Initial analytics data to display in the grid.
 * @property {(range: { from: Date; to: Date }) => Promise<GaMetricsResponse>} [onDateRangeChange] -
 * @property {string} [clientId] - Optional client ID for context, if needed.
 *   Optional async callback to fetch new data when the user selects a new date range.
 */
interface GaMetricsGridProps {
  data: GaMetricsResponse;
  onDateRangeChange?: (range: { from: Date; to: Date }) => Promise<GaMetricsResponse>;
  clientId?: string; // Optional client ID for context, if needed
}

// Utility to get first and last day of a month from any date
function getFullMonthRange(date: Date | string) {
  let year, month;
  if (typeof date === 'string') {
    // Parse as local date, not UTC, to avoid timezone issues
    const parts = date.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // JS months are 0-based
  } else {
    year = date.getFullYear();
    month = date.getMonth();
  }
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from, to };
}

/**
 * GaMetricsGrid
 *
 * Renders a responsive analytics dashboard for Google Analytics metrics, including:
 *   - KPI summary cards with YoY comparison
 *   - Channel and source breakdown pie charts
 *   - Daily sessions line chart
 *   - Monthly comparison chart (YoY)
 *   - Channel sessions table
 *
 * Handles dynamic date range selection and data aggregation for custom periods.
 *
 * @param {GaMetricsGridProps} props - Component props
 */
export function GaMetricsGrid({ data: initialData, onDateRangeChange, clientId }: GaMetricsGridProps) {
  // State to store the current data (updates when date range changes)
  const [data, setData] = React.useState<GaMetricsResponse>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  const { kpiMonthly, channelDaily, kpiDaily, sourceDaily, metadata } = data;

  // Update setupDefaultDateRange to always return a full month
  const setupDefaultDateRange = React.useCallback(() => {
    // If we have metadata with display date range, use it
    if (metadata?.displayDateRange) {
      // Snap to full month
      return getFullMonthRange(metadata.displayDateRange.from);
    }

    // If we have kpiDaily data, find the most recent month with data
    if (kpiDaily && kpiDaily.length > 0) {
      // Sort by date descending and get the most recent date
      const sortedData = [...kpiDaily].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const mostRecentDate = new Date(sortedData[0].date);
      return getFullMonthRange(mostRecentDate);
    }

    // Fallback to full previous month logic
    const today = new Date();
    // Get the first day of the current month
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Go back one day to get the last day of the previous month
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);

    lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);

    // Snap to full previous month
    return getFullMonthRange(lastDayOfPreviousMonth);
  }, [metadata, kpiDaily]);

  // Helper function to format date ranges consistently for display
  const formatDateRange = React.useCallback((from: Date, to: Date) => {
    return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
  }, []);

  // State for selected date range, default to most recent full month
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(null);

  // Use a ref to track if we've already set the initial date range
  const hasSetInitialDateRange = React.useRef(false);

  // Set default date range on mount only, and only when metadata.displayDateRange.from is available
  React.useEffect(() => {
    // Only set the initial date range once
    if (hasSetInitialDateRange.current) return;

    if (metadata?.displayDateRange?.from) {
      setDateRange(setupDefaultDateRange());
      hasSetInitialDateRange.current = true;
    } else if (kpiDaily && kpiDaily.length > 0) {
      // If no metadata but we have data, set date range based on available data
      setDateRange(setupDefaultDateRange());
      hasSetInitialDateRange.current = true;
    }
  }, [metadata?.displayDateRange?.from, kpiDaily, setupDefaultDateRange]);

  // Update handleDateRangeChange to always snap to full month
  const handleDateRangeChange = async (range: { from: Date; to: Date }) => {
    const snapped = getFullMonthRange(range.from);
    setDateRange(snapped);
    if (onDateRangeChange) {
      try {
        setIsLoading(true);
        const newData = await onDateRangeChange(snapped);
        setData(newData);
      } catch (error) {
        console.error('Error fetching data for date range:', error);
        // Could show an error message here
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Helper to check if a date string is within the selected range
  const isDateInRange = React.useCallback((dateStr: string) => {
    if (!dateRange) return true; // If no date range is selected, include all data

    // Use full data range from metadata if available
    const filterFrom = metadata?.fullDateRange?.from
      ? new Date(metadata.fullDateRange.from)
      : dateRange.from;
    const filterTo = metadata?.fullDateRange?.to
      ? new Date(metadata.fullDateRange.to)
      : dateRange.to;

    const date = new Date(dateStr);
    return date >= filterFrom && date <= filterTo;
  }, [dateRange, metadata]);

  // Helper to check if we have any data for the selected date range
  const hasDataForDateRange = React.useCallback((data: any[], dateRange: { from: Date; to: Date } | null) => {
    if (!data || data.length === 0) return false;
    if (!dateRange) return true; // If no date range, we have data

    return data.some(item => {
      const date = new Date(item.date);
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, []);

  // Filter daily data based on selected date range, with fallback to all data if no data in range
  const filteredDailyData = React.useMemo(() => {
    if (!kpiDaily) return null;

    // If no date range is selected, return all data
    if (!dateRange) return kpiDaily;

    // Check if we have data for the selected date range
    const hasDataInRange = hasDataForDateRange(kpiDaily, dateRange);

    // If no data in range, return all data instead of empty array
    if (!hasDataInRange) {
      console.log('No data available for selected date range, showing all available data');
      return kpiDaily;
    }

    // Otherwise, filter by date range
    return kpiDaily.filter(day => isDateInRange(day.date));
  }, [kpiDaily, dateRange, isDateInRange, hasDataForDateRange]);

  // Filter channel data based on selected date range, with fallback to all data if no data in range
  const filteredChannelData = React.useMemo(() => {
    if (!channelDaily) return null;

    // If no date range is selected, return all data
    if (!dateRange) return channelDaily;

    // Check if we have data for the selected date range
    const hasDataInRange = hasDataForDateRange(channelDaily, dateRange);

    // If no data in range, return all data instead of empty array
    if (!hasDataInRange) {
      console.log('No channel data available for selected date range, showing all available data');
      return channelDaily;
    }

    // Otherwise, filter by date range
    return channelDaily.filter((day: any) => isDateInRange(day.date));
  }, [channelDaily, dateRange, isDateInRange, hasDataForDateRange]);

  // Filter source data based on selected date range, with fallback to all data if no data in range
  const filteredSourceData = React.useMemo(() => {
    if (!sourceDaily) return null;

    // If no date range is selected, return all data
    if (!dateRange) return sourceDaily;

    // Check if we have data for the selected date range
    const hasDataInRange = hasDataForDateRange(sourceDaily, dateRange);

    // If no data in range, return all data instead of empty array
    if (!hasDataInRange) {
      console.log('No source data available for selected date range, showing all available data');
      return sourceDaily;
    }

    // Otherwise, filter by date range
    return sourceDaily.filter((day: any) => isDateInRange(day.date));
  }, [sourceDaily, dateRange, isDateInRange, hasDataForDateRange]);

  // Helper to get the current and previous year month objects from kpiMonthly
  // based on the selected date range. Returns { current, prevYear }.
  function getSelectedAndPrevYearMonth(kpiMonthly: any[], dateRange: { from: Date; to: Date } | null) {
    if (!kpiMonthly || kpiMonthly.length === 0) return { current: null, prevYear: null };
    const selectedRange = dateRange || {
      from: new Date(),
      to: new Date()
    };
    const selectedMonth = selectedRange.from.getFullYear() * 100 + (selectedRange.from.getMonth() + 1);
    const current = kpiMonthly.find(m => m.month === selectedMonth) || null;
    const prevYearMonth = selectedMonth - 100;
    const prevYear = kpiMonthly.find(m => m.month === prevYearMonth) || null;
    return { current, prevYear };
  }

  // --- Calculate current and prevYear month objects ---
  const { current, prevYear } = getSelectedAndPrevYearMonth(kpiMonthly || [], dateRange);

  // Calculate the min and max months from the last 12 months in kpiMonthly for the YoY chart label
  let yoyLabel = '';
  if (kpiMonthly && kpiMonthly.length > 0) {
    // Get all months, sort descending, take last 12, then sort ascending
    const monthsDesc = kpiMonthly.map(m => m.month).sort((a, b) => b - a);
    const last12Months = monthsDesc.slice(0, 12).sort((a, b) => a - b);
    const minMonth = last12Months[0];
    const maxMonth = last12Months[last12Months.length - 1];
    // Convert YYYYMM to Date
    const minYear = Math.floor(minMonth / 100);
    const minMonthNum = minMonth % 100;
    const maxYear = Math.floor(maxMonth / 100);
    const maxMonthNum = maxMonth % 100;
    const minDate = new Date(minYear, minMonthNum - 1, 1);
    // For max, use last day of the month
    const maxDate = new Date(maxYear, maxMonthNum, 0);
    yoyLabel = `Data from ${format(minDate, "MMM d, yyyy")} to ${format(maxDate, "MMM d, yyyy")}`;
  }

  // Helper to check if we're using fallback data (showing all data instead of filtered data)
  const isUsingFallbackData = React.useCallback((data: any[], filteredData: any[], dateRange: { from: Date; to: Date } | null) => {
    if (!dateRange || !data || data.length === 0) return false;

    // Check if there's any data for the selected date range
    const hasDataForSelectedRange = data.some(item => {
      const date = new Date(item.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    // If there's no data for the selected range, but we have filtered data, we're using fallback
    if (!hasDataForSelectedRange && filteredData && filteredData.length > 0) {
      return true;
    }

    return false;
  }, []);

  // Check if we're using fallback data for each dataset
  const isUsingFallbackDaily = isUsingFallbackData(kpiDaily || [], filteredDailyData || [], dateRange);
  const isUsingFallbackChannel = isUsingFallbackData(channelDaily || [], filteredChannelData || [], dateRange);
  const isUsingFallbackSource = isUsingFallbackData(sourceDaily || [], filteredSourceData || [], dateRange);

  // Display the date range being shown
  const displayRange = dateRange
    ? formatDateRange(dateRange.from, dateRange.to)
    : "Year-Over-Year Comparison";

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isLoading ? 'opacity-70' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary uppercase">Traffic and Usability</h1>
        </div>
        {dateRange && (
          <MonthRangePicker
            onChange={handleDateRangeChange}
            value={dateRange}
          />
        )}
      </div>

      <h2 className="text-xl font-bold mb-2">Monthly Website Traffic Overview</h2>
      <p className="text-gray-500 mb-2">
        {displayRange}
      </p>
      {(isUsingFallbackDaily || isUsingFallbackChannel || isUsingFallbackSource) && (
        <p className="text-sm text-amber-600 mb-2">
          ⚠️ No data available for selected date range.
        </p>
      )}
      <p className="text-sm text-gray-400 mb-6">
        {current ? "Showing metrics calculated from selected date range" : "Showing monthly summary data"}
      </p>

      {/* --- Metrics summary card grid --- */}
      <GaKpiSummaryGrid current={current} prevYear={prevYear} />

      {/* Show in columns if larger than medium screen, show in rows if smaller */}
      <div className="flex flex-col md:flex-row py-2">
        <GaChannelSessionsTable channelDaily={filteredChannelData} dateRange={dateRange} clientId={clientId} />
        {filteredChannelData && filteredChannelData.length > 0 && (
          <div className="w-1/3">
            <div className="flex flex-col items-start">
              <h2 className="text-lg font-bold mb-2">Sessions</h2>
              <p className="text-gray-500 mb-4 text-sm">by Channel</p>
              {dateRange && (
                <p className="text-xs text-gray-400 mb-2">
                  {formatDateRange(dateRange.from, dateRange.to)}
                </p>
              )}
            </div>
            <div className="flex flex-row">
              <PieChart
                data={filteredChannelData}
                dateRange={dateRange}
                type="channel"
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 mt-8">
        <div className="flex flex-col items-start mb-4">
          <h2 className="text-lg font-bold mb-2">Sessions by Day</h2>
          <p className="text-gray-500 text-sm">Current Period</p>
          {dateRange && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDateRange(dateRange.from, dateRange.to)}
            </p>
          )}
          {isUsingFallbackDaily && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Showing all available data (no data for selected period)
            </p>
          )}
        </div>
        {filteredDailyData && filteredDailyData.length > 0 && (
          <LineChart
            data={filteredDailyData}
            height={300}
            dateRange={dateRange}
            useFallbackData={isUsingFallbackDaily}
          />
        )}
      </div>

      <div className="flex-1 mt-10">
        <div className="flex flex-col items-start mb-4">
          <h2 className="text-lg font-bold mb-2">Sessions by Month</h2>
          <p className="text-gray-500 text-sm">Last 12 Calendar Months; Year-Over-Year Comparison</p>
          <p className="text-xs text-gray-400 mt-1">
            {yoyLabel}
          </p>
        </div>
        {kpiMonthly && kpiMonthly.length > 0 ? (
          <MonthlyComparisonChart
            data={kpiMonthly}
            height={400}
          />
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">
                Insufficient data for year-over-year comparison. At least 13 months of data is required.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}