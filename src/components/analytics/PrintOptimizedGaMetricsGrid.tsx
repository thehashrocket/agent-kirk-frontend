/**
 * @file src/components/analytics/PrintOptimizedGaMetricsGrid.tsx
 * Print-optimized version of the GaMetricsGrid component.
 * Displays analytics data without interactive controls, optimized for printing.
 */

import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { GaChannelSessionsTable } from './GaChannelSessionsTable';
import { PieChart } from './PieChart';
import { LineChart } from './LineChart';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import React from 'react';
import { format } from 'date-fns';
import { GaKpiSummaryGrid } from './GaKpiSummaryGrid';

/**
 * PrintOptimizedGaMetricsGrid Component
 *
 * File: src/components/analytics/PrintOptimizedGaMetricsGrid.tsx
 *
 * Purpose:
 *   - Displays analytics dashboard data in a print-friendly format
 *   - No interactive controls (date pickers, dropdowns)
 *   - Clean layout optimized for printing
 *   - Includes all charts and data tables
 *
 * Props:
 *   - data: Analytics data to display (see GaMetricsResponse type)
 */

interface PrintOptimizedGaMetricsGridProps {
  data: GaMetricsResponse;
}

// Utility to get first and last day of a month from any date
function getFullMonthRange(date: Date | string) {
  let year, month;
  if (typeof date === 'string') {
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
 * PrintOptimizedGaMetricsGrid
 *
 * Renders a print-optimized analytics dashboard for Google Analytics metrics, including:
 *   - KPI summary cards with YoY comparison
 *   - Channel and source breakdown pie charts
 *   - Daily sessions line chart
 *   - Monthly comparison chart (YoY)
 *   - Channel sessions table
 *
 * @param {PrintOptimizedGaMetricsGridProps} props - Component props
 */
export function PrintOptimizedGaMetricsGrid({ data }: PrintOptimizedGaMetricsGridProps) {
  const { kpiMonthly, channelDaily, kpiDaily, sourceDaily, metadata } = data;
  
  // Set up default date range from metadata
  const dateRange = React.useMemo(() => {
    if (metadata?.displayDateRange) {
      return getFullMonthRange(metadata.displayDateRange.from);
    }
    // Fallback to previous month
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);
    return getFullMonthRange(lastDayOfPreviousMonth);
  }, [metadata]);
  
  // Helper function to format date ranges consistently for display
  const formatDateRange = React.useCallback((from: Date, to: Date) => {
    return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
  }, []);

  // Helper to check if a date string is within the selected range
  const isDateInRange = React.useCallback((dateStr: string) => {
    if (!dateRange) return true;
    const filterFrom = metadata?.fullDateRange?.from 
      ? new Date(metadata.fullDateRange.from) 
      : dateRange.from;
    const filterTo = metadata?.fullDateRange?.to 
      ? new Date(metadata.fullDateRange.to) 
      : dateRange.to;
    const date = new Date(dateStr);
    return date >= filterFrom && date <= filterTo;
  }, [dateRange, metadata]);

  // Filter daily data based on selected date range
  const filteredDailyData = React.useMemo(() => {
    if (!kpiDaily) return null;
    return dateRange 
      ? kpiDaily.filter(day => isDateInRange(day.date))
      : kpiDaily;
  }, [kpiDaily, dateRange, isDateInRange]);
  
  // Filter channel data based on selected date range
  const filteredChannelData = React.useMemo(() => {
    if (!channelDaily) return null;
    return dateRange
      ? channelDaily.filter((day: any) => isDateInRange(day.date))
      : channelDaily;
  }, [channelDaily, dateRange, isDateInRange]);
  
  // Filter source data based on selected date range
  const filteredSourceData = React.useMemo(() => {
    if (!sourceDaily) return null;
    return dateRange
      ? sourceDaily.filter((day: any) => isDateInRange(day.date))
      : sourceDaily;
  }, [sourceDaily, dateRange, isDateInRange]);
  
  // Helper to get the current and previous year month objects from kpiMonthly
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

  // Calculate current and prevYear month objects
  const { current, prevYear } = getSelectedAndPrevYearMonth(kpiMonthly || [], dateRange);

  // Calculate the min and max months from the last 12 months in kpiMonthly for the YoY chart label
  let yoyLabel = '';
  if (kpiMonthly && kpiMonthly.length > 0) {
    const monthsDesc = kpiMonthly.map(m => m.month).sort((a, b) => b - a);
    const last12Months = monthsDesc.slice(0, 12).sort((a, b) => a - b);
    const minMonth = last12Months[0];
    const maxMonth = last12Months[last12Months.length - 1];
    const minYear = Math.floor(minMonth / 100);
    const minMonthNum = minMonth % 100;
    const maxYear = Math.floor(maxMonth / 100);
    const maxMonthNum = maxMonth % 100;
    const minDate = new Date(minYear, minMonthNum - 1, 1);
    const maxDate = new Date(maxYear, maxMonthNum, 0);
    yoyLabel = `Data from ${format(minDate, "MMM d, yyyy")} to ${format(maxDate, "MMM d, yyyy")}`;
  }

  // Display the date range being shown
  const displayRange = dateRange 
    ? formatDateRange(dateRange.from, dateRange.to)
    : "Year-Over-Year Comparison";

  // Check if we have valid data
  // if (!current) {
  //   return (
  //     <Card>
  //       <CardContent className="py-6">
  //         <p className="text-center text-muted-foreground">No analytics data available for selected period</p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0">{/* Print styles are in globals.css */}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Traffic and Usability</h1>
        <h2 className="text-xl font-bold mb-2">Monthly Website Traffic Overview</h2>
        <p className="text-gray-500 mb-2">{displayRange}</p>
        <p className="text-sm text-gray-400 mb-6">
          {current ? "Showing metrics calculated from selected date range" : "Showing monthly summary data"}
        </p>
      </div>
      
      {/* Metrics summary card grid */}
      <div className="avoid-break mb-8">
        <GaKpiSummaryGrid current={current} prevYear={prevYear} />
      </div>

      {/* Charts section */}
      <div className="flex flex-col md:flex-row md:items-start gap-8 mt-8 avoid-break">
        {filteredChannelData && filteredChannelData.length > 0 && (
          <div className="flex flex-col justify-center">
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
        {filteredSourceData && filteredSourceData.length > 0 && (
          <div className="flex flex-col justify-center">
            <div className="flex flex-col items-start">
              <h2 className="text-lg font-bold mb-2">Sessions</h2>
              <p className="text-gray-500 mb-4 text-sm">by Source</p>
              {dateRange && (
                <p className="text-xs text-gray-400 mb-2">
                  {formatDateRange(dateRange.from, dateRange.to)}
                </p>
              )}
            </div>
            <div className="flex flex-row">
              <PieChart 
                data={filteredSourceData} 
                dateRange={dateRange}
                type="source"
              />
            </div>
          </div>
        )}
      </div>

      {/* Channel sessions table */}
      <div className="flex-1 mt-8 avoid-break">
        <GaChannelSessionsTable channelDaily={filteredChannelData} dateRange={dateRange} />
      </div>

      {/* Daily sessions line chart */}
      <div className="flex-1 mt-8 page-break">
        <div className="flex flex-col items-start mb-4">
          <h2 className="text-lg font-bold mb-2">Sessions</h2>
          <p className="text-gray-500 text-sm">Current Period</p>
          {dateRange && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDateRange(dateRange.from, dateRange.to)}
            </p>
          )}
        </div>
        {filteredDailyData && filteredDailyData.length > 0 && (
          <LineChart 
            data={filteredDailyData} 
            height={300}
            dateRange={dateRange}
          />
        )}
      </div>

      {/* Monthly comparison chart */}
      <div className="flex-1 mt-10">
        <div className="flex flex-col items-start mb-4">
          <h2 className="text-lg font-bold mb-2">Sessions</h2>
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