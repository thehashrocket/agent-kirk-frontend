import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TableSortable, TableColumn } from '@/components/ui/TableSortable';
import React, { useEffect, useId, useRef, useState } from 'react';
import { format } from 'date-fns';

interface GaChannelSessionsTableProps {
  channelDaily: GaMetricsResponse['channelDaily'];
  dateRange?: { from: Date; to: Date } | null;
}

// Helper to extract YYYYMM from a date string (YYYY-MM-DD)
function getYearMonth(date: string) {
  return date.slice(0, 7).replace('-', '');
}

// Helper to extract year from YYYYMM
function getYear(yearMonth: string): number {
  return Math.floor(parseInt(yearMonth) / 100);
}

// Helper to extract month from YYYYMM
function getMonth(yearMonth: string): number {
  return parseInt(yearMonth) % 100;
}

type ChannelDailyItem = {
  channelGroup: string;
  sessions: number;
  date?: string | Date;
  [key: string]: any;
};

// Create a unique identifier for a channel data item based on date+channel+sessions
function getItemKey(item: ChannelDailyItem): string {
  const date = item.date ? item.date.toString() : '';
  const channel = item.channelGroup || 'unknown';
  return `${date}|${channel}|${item.sessions}`;
}

export function GaChannelSessionsTable({ channelDaily, dateRange }: GaChannelSessionsTableProps) {
  // Create a unique ID for this component instance for debugging
  const instanceId = useId();
  
  // Use state to track accumulated data to ensure re-renders when it changes
  const [accumulatedData, setAccumulatedData] = useState<ChannelDailyItem[]>([]);
  
  // Move hooks to top-level
  const [sort, setSort] = React.useState<{ accessor: string; direction: 'asc' | 'desc' }>({ accessor: 'sessions', direction: 'desc' });
  
  // Track component mounting and accumulate all data
  useEffect(() => {
    
    if (!channelDaily || channelDaily.length === 0) return;
    
    // Log first and last dates for debugging
    const firstItem = channelDaily[0] as ChannelDailyItem;
    const lastItem = channelDaily[channelDaily.length - 1] as ChannelDailyItem;
    
    // Create a Set of keys for the existing data
    const existingKeys = new Set(
      accumulatedData.map(item => getItemKey(item))
    );
    
    // Filter out only truly new items
    const itemsToAdd = (channelDaily as ChannelDailyItem[])
      .filter(item => !existingKeys.has(getItemKey(item)));
    
    
    if (itemsToAdd.length > 0) {
      // Log years in the new data
      const years = new Set<number>();
      itemsToAdd.forEach(item => {
        if (item.date) {
          const date = item.date.toString();
          const yearMonth = getYearMonth(date);
          const year = getYear(yearMonth);
          years.add(year);
        }
      });
      
      
      // Update the accumulated data state
      setAccumulatedData(prevData => [...prevData, ...itemsToAdd]);
    }
    
    return () => {
      console.log(`GaChannelSessionsTable instance ${instanceId} unmounted`);
    };
  }, [instanceId, channelDaily]);
  
  // Log when accumulated data changes
  useEffect(() => {
    console.log(`[${instanceId}] Accumulated data updated, now has ${accumulatedData.length} items`);
  }, [accumulatedData, instanceId]);

  const allRows = React.useMemo(() => {
    // Use all available data
    const dataToProcess = accumulatedData.length > 0 
      ? accumulatedData 
      : (channelDaily as ChannelDailyItem[] || []);
    
    
    if (dataToProcess.length === 0) return [];
    
    // First, process all data to ensure we find all dates
    const allYearMonths = new Set<string>();
    const allChannels = new Set<string>();
    const allYears = new Set<number>();
    
    // Create a flat data structure to help find the right comparisons
    const flattenedData: Array<{
      date: string; 
      yearMonth: string;
      year: number;
      month: number;
      channel: string;
      sessions: number;
    }> = [];
    
    // Track unique date+channel combinations to avoid duplicate counting
    const processedCombinations = new Set<string>();
    
    // Filter by date range if provided
    const isInDateRange = (dateStr: string) => {
      if (!dateRange) return true; // If no date range is selected, include all data
      
      const date = new Date(dateStr);
      return date >= dateRange.from && date <= dateRange.to;
    };
    
    dataToProcess.forEach((row: ChannelDailyItem) => {
      if (!row.date) return;
      
      const date = typeof row.date === 'string' ? row.date : row.date.toString();
      
      // Apply date range filter if provided
      if (!isInDateRange(date)) return;
      
      const channel = row.channelGroup || 'Unknown';
      const key = `${date}|${channel}`;
      
      // Skip if we've already processed this date+channel combination
      if (processedCombinations.has(key)) return;
      processedCombinations.add(key);
      
      const yearMonth = getYearMonth(date);
      if (!yearMonth) return;
      
      const year = getYear(yearMonth);
      const month = getMonth(yearMonth);
      
      allYearMonths.add(yearMonth);
      allChannels.add(channel);
      allYears.add(year);
      
      flattenedData.push({
        date,
        yearMonth,
        year,
        month,
        channel,
        sessions: row.sessions
      });
    });
    
    
    // Sort year-months descending to find the most recent
    const sortedYearMonths = Array.from(allYearMonths).sort().reverse();
    if (sortedYearMonths.length === 0) {
      console.log(`[${instanceId}] No year-months found in selected date range`);
      return [];
    }
    
    // For date-range filtered data, create a single aggregated view instead of using "most recent month"
    const aggregatedData: Record<string, number> = {};
    
    flattenedData.forEach(item => {
      aggregatedData[item.channel] = (aggregatedData[item.channel] || 0) + item.sessions;
    });
    
    // Get the most recent year-month data for comparison (maintaining existing comparisons)
    const currentYearMonth = sortedYearMonths[0];
    const currentYear = getYear(currentYearMonth);
    const currentMonth = getMonth(currentYearMonth);
    
    // Look for comparison data
    let comparisonData: Record<string, number> = {};
    let comparisonSource = '';
    const availableYears = Array.from(allYears).sort((a, b) => b - a); // Sort descending
    
    // If the most recent year is 2025, try to compare with 2024 data first
    if (currentYear === 2025 && availableYears.includes(2024)) {
      // Look specifically for data from 2024 for the same month 
      const comparisonMonth2024 = flattenedData.filter(
        item => item.year === 2024 && item.month === currentMonth
      );
      
      if (comparisonMonth2024.length > 0) {
        // We found comparison data for the same month in 2024
        comparisonMonth2024.forEach(item => {
          comparisonData[item.channel] = (comparisonData[item.channel] || 0) + item.sessions;
        });
        comparisonSource = `month ${currentMonth} from 2024`;
      } else {
        // No data for the same month, try all 2024 data
        const allData2024 = flattenedData.filter(item => item.year === 2024);
        if (allData2024.length > 0) {
          allData2024.forEach(item => {
            comparisonData[item.channel] = (comparisonData[item.channel] || 0) + item.sessions;
          });
          comparisonSource = 'all months from 2024';
        }
      }
    } else {
      // Standard comparison with previous year, same month
      const previousYear = currentYear - 1;
      
      if (availableYears.includes(previousYear)) {
        // Look for same month in previous year
        const previousYearEntries = flattenedData.filter(
          item => item.year === previousYear && item.month === currentMonth
        );
        
        if (previousYearEntries.length > 0) {
          previousYearEntries.forEach(item => {
            comparisonData[item.channel] = (comparisonData[item.channel] || 0) + item.sessions;
          });
          comparisonSource = `month ${currentMonth} from ${previousYear}`;
        } else {
          // No data for the same month, try all data from previous year
          const allPreviousYearData = flattenedData.filter(item => item.year === previousYear);
          if (allPreviousYearData.length > 0) {
            allPreviousYearData.forEach(item => {
              comparisonData[item.channel] = (comparisonData[item.channel] || 0) + item.sessions;
            });
            comparisonSource = `all months from ${previousYear}`;
          }
        }
      }
    }
    
    // If no comparison data yet, use the next oldest year's data
    if (Object.keys(comparisonData).length === 0 && availableYears.length > 1) {
      const oldestYear = Math.min(...availableYears);
      if (oldestYear < currentYear) {
        const oldestYearData = flattenedData.filter(item => item.year === oldestYear);
        oldestYearData.forEach(item => {
          comparisonData[item.channel] = (comparisonData[item.channel] || 0) + item.sessions;
        });
        comparisonSource = `all available data from ${oldestYear}`;
      }
    }
    
   
    // Map to row format with comparisons using aggregated data
    return Object.entries(aggregatedData)
      .map(([channel, sessions]) => {
        const prev = comparisonData[channel] || 0;
        const diff = sessions - prev;
        const percent = prev > 0 ? (diff / prev) * 100 : null;
        
        return { 
          channel, 
          sessions, 
          prev,
          diff,
          percent 
        };
      });
  }, [channelDaily, instanceId, accumulatedData]);

  // For grand total
  const totals = React.useMemo(() => {
    if (allRows.length === 0) return { current: 0, prev: 0, percent: null };
    
    const totalSessions = allRows.reduce((sum, r) => sum + r.sessions, 0);
    const totalPrev = allRows.reduce((sum, r) => sum + (r.prev || 0), 0);
    const totalDiff = totalSessions - totalPrev;
    const totalPercent = totalPrev > 0 ? (totalDiff / totalPrev) * 100 : null;
    
    return { current: totalSessions, prev: totalPrev, diff: totalDiff, percent: totalPercent };
  }, [allRows]);

  // Table columns
  const columns = React.useMemo<TableColumn<typeof allRows[0]>[]>(() => [
    {
      header: 'Channel',
      accessor: 'channel',
      sortable: true,
    },
    {
      header: 'Sessions',
      accessor: 'sessions',
      align: 'right',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      header: '% Δ',
      accessor: 'percent',
      align: 'right',
      sortable: true,
      render: (value, row) =>
        value === null ? (
          <span className="text-gray-400">—</span>
        ) : (
          <span className={`inline-flex items-center gap-1 ${value > 0 ? 'text-green-600' : value < 0 ? 'text-red-500' : ''}`}>
            {value > 0 && <ArrowUpRight size={14} className="inline" />} 
            {value < 0 && <ArrowDownRight size={14} className="inline" />} 
            {Math.abs(value).toFixed(1)}%
          </span>
        ),
    },
  ], []);

  const sortedRows = React.useMemo(() => {
    const col = columns.find(c => c.accessor === sort.accessor);
    if (!col || !col.sortable) return allRows;
    return [...allRows].sort((a, b) => {
      const aVal = (a as any)[col.accessor];
      const bVal = (b as any)[col.accessor];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [allRows, sort, columns]);
  
  const topRows = sortedRows.slice(0, 6);

  if (!channelDaily || channelDaily.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No channel data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col items-start mb-4">
        <h2 className="text-lg font-bold mb-2">Sessions</h2>
        <p className="text-gray-500 mb-1 text-sm">by Channel</p>
        {dateRange && (
          <p className="text-xs text-gray-400 mb-2">
            {format(dateRange.from, 'MMM d, yyyy')} - 
            {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        )}
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-2">Sessions by Channel</h2>
          <p className="text-gray-500 mb-4 text-sm">Year-Over-Year Comparison</p>
          <TableSortable
            columns={columns}
            data={topRows}
            initialSort={sort}
            rowKey={row => row.channel}
          />
          <div className="flex justify-between items-center mt-4 px-2">
            <span className="font-bold">Grand total</span>
            <span className="font-bold">{totals.current.toLocaleString()}</span>
            <span className={`font-bold ${totals.percent === null ? 'text-gray-400' : totals.percent > 0 ? 'text-green-600' : totals.percent < 0 ? 'text-red-500' : ''}`}>
              {totals.percent === null ? '—' : (
                <span className="inline-flex items-center gap-1">
                  {totals.percent > 0 && <ArrowUpRight size={14} className="inline" />} 
                  {totals.percent < 0 && <ArrowDownRight size={14} className="inline" />} 
                  {Math.abs(totals.percent).toFixed(1)}%
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 