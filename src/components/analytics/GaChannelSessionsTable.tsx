import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { TableSortable, TableColumn } from '@/components/ui/TableSortable';
import React, { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  
  // Move hooks to top-level
  const [sort, setSort] = React.useState<{ accessor: string; direction: 'asc' | 'desc' }>({ accessor: 'sessions', direction: 'desc' });
  
  const router = useRouter();
  
  const allRows = React.useMemo(() => {
    if (!channelDaily || channelDaily.length === 0) return [];

    // --- New logic for true year-over-year comparison ---
    // 1. Group sessions by channel and yearMonth
    const sessionsByChannelMonth: Record<string, Record<string, number>> = {};
    channelDaily.forEach((row: ChannelDailyItem) => {
      if (!row.date) return;
      const date = typeof row.date === 'string' ? row.date : row.date.toString();
      const yearMonth = getYearMonth(date);
      const channel = row.channelGroup || 'Unknown';
      if (!sessionsByChannelMonth[channel]) sessionsByChannelMonth[channel] = {};
      sessionsByChannelMonth[channel][yearMonth] = (sessionsByChannelMonth[channel][yearMonth] || 0) + row.sessions;
    });

    // 2. Determine which months are in the selected range
    let monthsInRange: string[] = [];
    if (dateRange) {
      // Build a list of yearMonth strings between from and to
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      const months: string[] = [];
      let current = new Date(from.getFullYear(), from.getMonth(), 1);
      while (current <= to) {
        const ym = `${current.getFullYear()}${(current.getMonth() + 1).toString().padStart(2, '0')}`;
        months.push(ym);
        current.setMonth(current.getMonth() + 1);
      }
      monthsInRange = months;
    } else {
      // If no range, use all months present in the data
      const allMonths = new Set<string>();
      Object.values(sessionsByChannelMonth).forEach(channelData => {
        Object.keys(channelData).forEach(ym => allMonths.add(ym));
      });
      monthsInRange = Array.from(allMonths);
    }

    // 3. For each channel, sum sessions for months in range (current) and same months previous year (prev)
    const result: Array<{ channel: string; sessions: number; prev: number; diff: number; percent: number | null }> = [];
    Object.entries(sessionsByChannelMonth).forEach(([channel, monthData]) => {
      let currentTotal = 0;
      let prevTotal = 0;
      monthsInRange.forEach(ym => {
        currentTotal += monthData[ym] || 0;
        // Previous year month string
        const prevYm = (parseInt(ym) - 100).toString();
        prevTotal += monthData[prevYm] || 0;
      });
      const diff = currentTotal - prevTotal;
      const percent = prevTotal > 0 ? (diff / prevTotal) * 100 : null;
      result.push({ channel, sessions: currentTotal, prev: prevTotal, diff, percent });
    });

    return result;
  }, [channelDaily, dateRange]);

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
      render: (value, row) => (
        <div className="flex items-center w-full">
          <span>{value}</span>
          <ArrowRight className="ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" size={16} />
        </div>
      ),
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

  // Handler for row click
  const handleRowClick = (row: typeof allRows[0]) => {
    if (!row.channel) return;
    // format the channel name to lowercase and replace spaces with dashes
    const formattedChannel = row.channel.toLowerCase().replace(/\s+/g, '-');
    const encoded = encodeURIComponent(formattedChannel);
    router.push(`/analytics/channel/${encoded}`);
  };

  // Styling for clickable rows
  const rowClassName = () => 'group';

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
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold mb-2">Sessions by Channel</h2>
          <p className="text-gray-500 mb-4 text-sm">Year-Over-Year Comparison</p>
          <TableSortable
            columns={columns}
            data={topRows}
            initialSort={sort}
            rowKey={row => row.channel}
            onRowClick={handleRowClick}
            rowClassName={rowClassName}
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