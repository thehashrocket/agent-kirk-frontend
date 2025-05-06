'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { Info } from 'lucide-react';
import { GaChannelSessionsTable } from './GaChannelSessionsTable';
import { PieChart, PieChartData } from './PieChart';
import { LineChart } from './LineChart';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import CountUp from 'react-countup';
import { MonthRangePicker } from './MonthRangePicker';
import React from 'react';
import { format } from 'date-fns';

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
 *   Optional async callback to fetch new data when the user selects a new date range.
 */
interface GaMetricsGridProps {
  data: GaMetricsResponse;
  onDateRangeChange?: (range: { from: Date; to: Date }) => Promise<GaMetricsResponse>;
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
export function GaMetricsGrid({ data: initialData, onDateRangeChange }: GaMetricsGridProps) {
  // State to store the current data (updates when date range changes)
  const [data, setData] = React.useState<GaMetricsResponse>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { kpiMonthly, channelDaily, kpiDaily, sourceDaily, metadata } = data;
  
  // Helper to extract YYYYMM from a date string (YYYY-MM-DD)
  const getYearMonth = React.useCallback((date: string): string => {
    return date.slice(0, 7).replace('-', '');
  }, []);
  
  // Set up default date range (most recent full month or from metadata)
  const setupDefaultDateRange = React.useCallback(() => {
    // If we have metadata with display date range, use it
    if (metadata?.displayDateRange) {
      return {
        from: new Date(metadata.displayDateRange.from),
        to: new Date(metadata.displayDateRange.to)
      };
    }
    // Fallback to full previous month logic
    const today = new Date();
    // Get the first day of the current month
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Go back one day to get the last day of the previous month
    const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth);
    lastDayOfPreviousMonth.setDate(lastDayOfPreviousMonth.getDate() - 1);
    // Get the first day of the previous month
    const firstDayOfPreviousMonth = new Date(lastDayOfPreviousMonth.getFullYear(), lastDayOfPreviousMonth.getMonth(), 1);
    return { 
      from: firstDayOfPreviousMonth,
      to: lastDayOfPreviousMonth 
    };
  }, [metadata]);
  
  // Helper function to format date ranges consistently for display
  const formatDateRange = React.useCallback((from: Date, to: Date) => {
    return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
  }, []);
  
  // State for selected date range, default to most recent full month
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(null);
  
  // Set default date range on mount and when metadata changes
  React.useEffect(() => {
    setDateRange(setupDefaultDateRange());
  }, [setupDefaultDateRange, metadata]);
  
  // Handle date range change (fetches new data if callback provided)
  const handleDateRangeChange = async (range: { from: Date; to: Date }) => {
    setDateRange(range);
    if (onDateRangeChange) {
      try {
        setIsLoading(true);
        const newData = await onDateRangeChange(range);
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
  
  // Calculate metrics based on selected date range (aggregates daily data)
  const calculateFilteredMetrics = React.useCallback(() => {
    if (!filteredDailyData || filteredDailyData.length === 0) {
      return null;
    }
    // Start with empty metrics object that matches the structure of monthly data
    const metrics: any = {
      sessions: 0,
      screenPageViewsPerSession: 0,
      avgSessionDurationSec: 0,
      engagementRate: 0,
      goalCompletions: 0,
      goalCompletionRate: 0
    };
    // Calculate total and average metrics based on filtered daily data
    let totalSessions = 0;
    let totalPageViews = 0;
    let totalSessionDuration = 0;
    let totalEngagements = 0;
    let totalGoalCompletions = 0;
    filteredDailyData.forEach(day => {
      const sessions = day.sessions || 0;
      totalSessions += sessions;
      // Calculate page views from screenPageViewsPerSession * sessions
      const pageViewsPerSession = day.screenPageViewsPerSession || 0;
      totalPageViews += pageViewsPerSession * sessions;
      // Calculate session duration
      totalSessionDuration += (day.avgSessionDurationSec || 0) * sessions;
      // Calculate engaged sessions from engagementRate * sessions
      const engagementRate = day.engagementRate || 0;
      totalEngagements += engagementRate * sessions;
      totalGoalCompletions += day.goalCompletions || 0;
    });
    // Calculate averages and rates
    metrics.sessions = totalSessions;
    metrics.screenPageViewsPerSession = totalSessions > 0 ? totalPageViews / totalSessions : 0;
    metrics.avgSessionDurationSec = totalSessions > 0 ? totalSessionDuration / totalSessions : 0;
    metrics.engagementRate = totalSessions > 0 ? totalEngagements / totalSessions : 0;
    metrics.goalCompletions = totalGoalCompletions;
    metrics.goalCompletionRate = totalSessions > 0 ? totalGoalCompletions / totalSessions : 0;
    return metrics;
  }, [filteredDailyData]);
  
  // Get metrics for the selected range (memoized)
  const calculatedMetrics = React.useMemo(() => {
    return calculateFilteredMetrics();
  }, [calculateFilteredMetrics]);
  
  // Find the most recent month from the selected range or default to original logic
  const getMonthlySummaryData = React.useMemo(() => {
    if (!kpiMonthly || kpiMonthly.length === 0) return { current: null, prevYear: null };
    if (calculatedMetrics) {
      // If we have calculated metrics from the filter, use them for current
      // Find the year-over-year comparison data
      // Convert the month of the selected date range to YYYYMM format
      const selectedRange = dateRange || {
        from: new Date(),
        to: new Date()
      };
      const selectedMonth = selectedRange.from.getFullYear() * 100 + (selectedRange.from.getMonth() + 1);
      // Find the same month last year (YYYYMM - 100)
      const prevYearMonth = selectedMonth - 100;
      const prevYear = kpiMonthly.find(m => m.month === prevYearMonth);
      return { current: calculatedMetrics, prevYear };
    }
    // First, convert dates to ensure we're working with the right format
    const selectedRange = dateRange || {
      from: new Date(),
      to: new Date()
    };
    // Convert the month of the selected date range to YYYYMM format
    const selectedMonth = selectedRange.from.getFullYear() * 100 + (selectedRange.from.getMonth() + 1);
    // Find the month that matches our selected range
    const selectedMonthData = kpiMonthly.find(m => m.month === selectedMonth);
    // If we don't have data for the selected month, fall back to the most recent month
    const sorted = [...kpiMonthly].sort((a, b) => b.month - a.month);
    const current = selectedMonthData || sorted[0];
    // Find the same month last year (YYYYMM - 100)
    const prevYearMonth = current.month - 100;
    const prevYear = kpiMonthly.find(m => m.month === prevYearMonth);
    return { current, prevYear };
  }, [kpiMonthly, dateRange, calculatedMetrics]);

  // Extract from our memo to use in the component
  const { current, prevYear } = getMonthlySummaryData;
  
  // Check if we have valid data
  if (!current) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No analytics data available for selected period</p>
        </CardContent>
      </Card>
    );
  }

  // Helper for YoY change
  function getYoY(currentVal: number, prevVal?: number) {
    if (prevVal === undefined || prevVal === 0) return null;
    const diff = currentVal - prevVal;
    const percent = (diff / Math.abs(prevVal)) * 100;
    return percent;
  }

  // Helper to safely handle arithmetic with potential string values
  function ensureNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Metric definitions
  const metrics: Array<{
    key: string;
    label: string;
    tooltip: string;
    format?: (v: number) => string;
  }> = [
      {
        key: 'sessions',
        label: 'Sessions',
        tooltip: 'Total number of sessions for the month.'
      },
      {
        key: 'screenPageViewsPerSession',
        label: 'Pages / Session',
        tooltip: 'Average number of pages viewed per session.'
      },
      {
        key: 'avgSessionDurationSec',
        label: 'Avg. Session Duration',
        tooltip: 'Average session duration (mm:ss).',
        format: (v: number) => {
          const m = Math.floor(v / 60);
          const s = Math.floor(v % 60);
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
      },
      {
        key: 'engagementRate',
        label: 'Engagement Rate',
        tooltip: 'Percentage of engaged sessions.',
        format: (v: number) => `${(v * 100).toFixed(2)}%`
      },
      {
        key: 'goalCompletions',
        label: 'Goal Completions',
        tooltip: 'Number of goal completions.'
      },
      {
        key: 'goalCompletionRate',
        label: 'Goal Completion Rate',
        tooltip: 'Goal completions per session.',
        format: (v: number) => `${(v * 100).toFixed(2)}%`
      }
    ];

  // Use filtered data for aggregation
  // Shared aggregation for most recent month
  let pieData: PieChartData[] = [];
  let topRows: { channel: string; sessions: number }[] = [];
  // Sessions by Source pie chart data
  let sourcePieData: PieChartData[] = [];

  if (filteredChannelData && filteredChannelData.length > 0) {
    // Group by year-month
    const sessionsByMonth: Record<string, Record<string, number>> = {};
    let totalSessionsInSelectedPeriod = 0;
    
    // Create a map to aggregate all channel data across the entire selected period
    const aggregatedChannelData: Record<string, number> = {};
    
    filteredChannelData.forEach((row: any) => {
      // Count total sessions in the filtered data (selected date range)
      totalSessionsInSelectedPeriod += row.sessions;
      
      // Add to channel aggregation
      const channel = row.channelGroup || 'Unknown';
      aggregatedChannelData[channel] = (aggregatedChannelData[channel] || 0) + row.sessions;
      
      // Also keep the monthly breakdown for reference
      const ym = getYearMonth(row.date || '');
      if (!ym) return;
      if (!sessionsByMonth[ym]) sessionsByMonth[ym] = {};
      sessionsByMonth[ym][row.channelGroup] = (sessionsByMonth[ym][row.channelGroup] || 0) + row.sessions;
    });
    
    // Debug logging
    console.log(`DEBUG: Channel data breakdown for total ${totalSessionsInSelectedPeriod} sessions:`);
    Object.entries(aggregatedChannelData).forEach(([channel, sessions]) => {
      console.log(`DEBUG: - ${channel}: ${sessions} sessions (${((sessions/totalSessionsInSelectedPeriod)*100).toFixed(1)}%)`);
    });
    
    // In case we need monthly data, keep finding the most recent month
    const months = Object.keys(sessionsByMonth).sort().reverse();
    const currentMonth = months[0];
    const currentMonthData = sessionsByMonth[currentMonth] || {};
    
    // Colors as before
    const colorMap: Record<string, string> = {
      'Direct': '#e69832',
      'Organic Search': '#1a3766',
      'Email': '#6b6e6e',
      'Referral': '#a6b6c6',
      'Organic Social': '#4a90e2',
      'Unassigned': '#cccccc',
    };
    
    // Instead of using only the current month, use the aggregated data from the entire selected period
    pieData = Object.entries(aggregatedChannelData).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#ccc',
    })).sort((a, b) => b.value - a.value);
    
    topRows = pieData.map(({ name, value }) => ({ channel: name, sessions: value }));

    // Calculate the total for all pie data
    const pieDataTotal = pieData.reduce((sum, item) => sum + item.value, 0);
    console.log(`DEBUG: Total sessions in pie chart data: ${pieDataTotal}`);
    console.log(`DEBUG: Total sessions in calculatedMetrics: ${calculatedMetrics?.sessions || 'Not available'}`);
    
    if (calculatedMetrics && Math.abs(pieDataTotal - calculatedMetrics.sessions) > 1) {
      console.warn(`DEBUG: WARNING - Pie chart total (${pieDataTotal}) does not match metrics total (${calculatedMetrics.sessions})`);
    }

    // --- Sessions by Source Pie Chart ---
    if (filteredSourceData && filteredSourceData.length > 0) {
      // Aggregate source data across the entire selected period instead of just one month
      const aggregatedSourceData: Record<string, number> = {};
      
      filteredSourceData.forEach((row: any) => {
        const source = row.trafficSource || 'Unknown';
        aggregatedSourceData[source] = (aggregatedSourceData[source] || 0) + row.sessions;
      });
      
      // Source data preparation - sort sources by value
      let entries = Object.entries(aggregatedSourceData).map(([name, value]) => ({ name, value }));
      entries.sort((a, b) => b.value - a.value);
      const total = entries.reduce((sum, e) => sum + e.value, 0);
      
      // Group small sources into 'Others' (less than 5% or after top 7)
      const mainSources = entries.filter((e, i) => i < 7 && e.value / total >= 0.05);
      const others = entries.filter((e, i) => !(i < 7 && e.value / total >= 0.05));
      const othersValue = others.reduce((sum, e) => sum + e.value, 0);
      
      // Color palette for sources
      const sourceColors = [
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
      ];
      
      let colorIdx = 0;
      sourcePieData = mainSources.map((e) => ({
        name: e.name,
        value: e.value,
        color: sourceColors[colorIdx++] || '#ccc',
      }));
      
      if (othersValue > 0) {
        sourcePieData.push({ name: 'Others', value: othersValue, color: '#444444' });
      }
      
      // Debug log for source data
      console.log(`DEBUG: Total sessions in source pie chart: ${sourcePieData.reduce((sum, item) => sum + item.value, 0)}`);
    }
  }

  // Display the date range being shown
  const displayRange = dateRange 
    ? formatDateRange(dateRange.from, dateRange.to)
    : "Year-Over-Year Comparison";

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isLoading ? 'opacity-70' : ''}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">1905 New Media Traffic and Usability</h1>
        </div>
        <MonthRangePicker 
          onChange={handleDateRangeChange} 
          defaultValue={setupDefaultDateRange()} 
        />
      </div>
      
      <h2 className="text-xl font-bold mb-2">Monthly Website Traffic Overview</h2>
      <p className="text-gray-500 mb-2">
        {displayRange}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {calculatedMetrics ? "Showing metrics calculated from selected date range" : "Showing monthly summary data"}
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {metrics.map(metric => {
          // Use current metrics directly
          const rawValue = current ? current[metric.key as keyof typeof current] : null;
          const rawPrev = prevYear ? prevYear[metric.key as keyof typeof prevYear] : undefined;
          
          // Ensure we're working with numbers
          const value = ensureNumber(rawValue);
          const prev = rawPrev !== undefined ? ensureNumber(rawPrev) : undefined;
          
          const percent = prev !== undefined ? getYoY(value, prev) : null;
          const display = metric.format ? metric.format(value) : typeof value === 'number' ? value.toLocaleString() : String(value);
          
          // Format YoY delta for time and percent
          let deltaDisplay = '';
          if (prev !== undefined && prev !== 0) {
            if (metric.key === 'avgSessionDurationSec') {
              const diff = value - prev;
              const sign = diff > 0 ? '+' : '';
              const m = Math.floor(Math.abs(diff) / 60);
              const s = Math.floor(Math.abs(diff) % 60);
              deltaDisplay = `${sign}${diff < 0 ? '-' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            } else if (metric.key === 'engagementRate' || metric.key === 'goalCompletionRate') {
              const diff = value - prev;
              const sign = diff > 0 ? '+' : '';
              deltaDisplay = `${sign}${(diff * 100).toFixed(2)}%`;
            } else {
              const diff = value - prev;
              const sign = diff > 0 ? '+' : '';
              deltaDisplay = `${sign}${diff.toLocaleString()}`;
            }
          }
          // Color for YoY
          let yoyColor = '';
          if (percent !== null) {
            yoyColor = percent > 0 ? 'text-green-600' : percent < 0 ? 'text-red-500' : 'text-gray-400';
          }
          let arrow = '';
          if (percent !== null) {
            arrow = percent > 0 ? '↑' : percent < 0 ? '↓' : '';
          }
          return (
            <div key={metric.key} className="flex flex-col items-center justify-center bg-white rounded-xl border h-56 p-4 shadow-sm">
              <div className="flex flex-col items-center w-full mb-2">
                <div className="flex items-center gap-1 text-gray-500 text-base font-medium mt-1">
                  <span>{metric.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="ml-1 cursor-pointer outline-none">
                        <Info size={16} className="text-orange-400" aria-label="Info" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{metric.tooltip}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                <span className="text-3xl font-bold text-black tracking-tight">
                  {typeof value === 'number' ? (
                    metric.format ? (
                      metric.key === 'avgSessionDurationSec' ? (
                        // Special handling for duration
                        <>
                          <CountUp 
                            end={Math.floor(value / 60)} 
                            duration={2} 
                            separator="," 
                            decimals={0}
                            decimal="."
                            preserveValue={true}
                            suffix=":"
                          />
                          <CountUp 
                            end={value % 60} 
                            duration={2} 
                            separator="," 
                            decimals={0}
                            decimal="."
                            preserveValue={true}
                            formattingFn={(value) => value.toString().padStart(2, '0')}
                          />
                        </>
                      ) : metric.key === 'engagementRate' || metric.key === 'goalCompletionRate' ? (
                        // Percentage format
                        <CountUp 
                          end={value * 100} 
                          duration={2} 
                          separator="," 
                          decimals={2}
                          decimal="."
                          preserveValue={true}
                          suffix="%"
                        />
                      ) : (
                        // Other formatted values
                        <CountUp 
                          end={value} 
                          duration={2} 
                          separator="," 
                          decimals={0}
                          decimal="."
                          preserveValue={true}
                        />
                      )
                    ) : (
                      // Regular number
                      <CountUp 
                        end={value} 
                        duration={2} 
                        separator="," 
                        decimals={0}
                        decimal="."
                        preserveValue={true}
                      />
                    )
                  ) : (
                    display
                  )}
                </span>
                {percent !== null && (
                  <span className={`mt-2 flex items-center gap-1 text-sm font-medium ${yoyColor}`}>
                    {arrow} {deltaDisplay || '—'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col md:flex-row md:items-start gap-8 mt-8">
        {pieData.length > 0 && (
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
              <PieChart data={pieData} />
            </div>
          </div>
        )}
        {sourcePieData.length > 0 && (
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
              <PieChart data={sourcePieData} />
            </div>
          </div>
        )}

      </div>
      <div className="flex-1">
        <GaChannelSessionsTable channelDaily={filteredChannelData} dateRange={dateRange} />
      </div>
      <div className="flex-1 mt-8">
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
            data={filteredDailyData.map(day => ({ 
              date: day.date,
              sessions: day.sessions
            }))} 
            height={300}
            dateRange={dateRange}
          />
        )}
      </div>

      <div className="flex-1 mt-10">
        <div className="flex flex-col items-start mb-4">
          <h2 className="text-lg font-bold mb-2">Sessions</h2>
          <p className="text-gray-500 text-sm">Last 12 Calendar Months; Year-Over-Year Comparison</p>
          <p className="text-xs text-gray-400 mt-1">
            {metadata?.fullDateRange?.from && metadata?.fullDateRange?.to && 
              `Data from ${format(new Date(metadata.fullDateRange.from), "MMM d, yyyy")} to ${format(new Date(metadata.fullDateRange.to), "MMM d, yyyy")}`
            }
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