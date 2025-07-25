import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
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

type ChannelDailyItem = {
  channelGroup: string;
  sessions: number;
  date?: string | Date;
  [key: string]: any;
};

export function GaChannelSessionsTable({ channelDaily, dateRange }: GaChannelSessionsTableProps) {

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

  // Helper function to check if a channel is clickable
  const isClickableChannel = (channel: string): boolean => {
    const clickableChannels = ['Email', 'Direct', 'Organic Social'];
    return clickableChannels.includes(channel);
  };

  // Table columns
  type RowWithNumber = { channel: string; sessions: number; prev: number; diff: number; percent: number | null; rowNumber: number };
  const columns: TableColumn<RowWithNumber>[] = React.useMemo(() => [
    {
      header: '',
      accessor: 'rowNumber',
      sortable: false,
      render: (value: number) => (
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-base font-semibold text-primary">
          {value}
        </div>
      ),
    },
    {
      header: 'Channel',
      accessor: 'channel',
      sortable: true,
      render: (value: string, row: RowWithNumber) => {
        const clickable = isClickableChannel(value);
        return (
          <div className="flex items-center w-full">
            <span
              className={
                clickable
                  ? 'text-primary underline cursor-pointer inline-flex items-center font-medium hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/50'
                  : 'text-black'
              }
            >
              {value}
              {clickable && (
                <ExternalLink className="ml-1 h-4 w-4 text-muted-foreground" aria-label="View Sessions report" size={16} />
              )}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Sessions',
      accessor: 'sessions',
      align: 'right',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      header: '% Δ',
      accessor: 'percent',
      align: 'right',
      sortable: true,
      render: (value: number | null, row: RowWithNumber) =>
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

  // Calculate sorted rows and slice for top 6
  const sortedRows = React.useMemo(() => {
    const col = columns.find((c: TableColumn<RowWithNumber>) => c.accessor === sort.accessor);
    if (!col || !col.sortable) return allRows;
    return [...allRows].sort((a, b) => {
      const aVal = (a as any)[col.accessor as string];
      const bVal = (b as any)[col.accessor as string];
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

  const topRows: Array<{ channel: string; sessions: number; prev: number; diff: number; percent: number | null }> = sortedRows.slice(0, 6);

  // Add row numbers to the rows for display
  const topRowsWithNumbers: RowWithNumber[] = topRows.map((row: typeof topRows[0], idx: number) => ({ ...row, rowNumber: idx + 1 }));

  // Handler for row click
  const handleRowClick = (row: typeof allRows[0]) => {
    if (!row.channel || !isClickableChannel(row.channel)) return;
    // format the channel name to lowercase and replace spaces with dashes
    const formattedChannel = row.channel.toLowerCase().replace(/\s+/g, '-');
    const encoded = encodeURIComponent(formattedChannel);
    router.push(`/analytics/channel/${encoded}`);
  };

  // Styling for clickable rows
  const rowClassName = (row: typeof allRows[0]) => {
    return isClickableChannel(row.channel) ? 'group cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/50';
  };

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
    <div className="w-2/3 pr-5">
      <h2 className="text-lg font-bold mb-2">Sessions by Channel</h2>
      <p className="text-gray-500 mb-4 text-sm">Year-Over-Year Comparison</p>
      <TableSortable
        columns={columns}
        data={topRowsWithNumbers}
        initialSort={sort}
        rowKey={row => row.channel}
        onRowClick={handleRowClick}
        rowClassName={rowClassName}
      />
      <div className="flex mt-4">
        <div className="font-bold w-2/3">Grand total</div>
        <div className="flex items-center gap-5 ml-auto w-1/3">
          <div className="font-bold flex justify-end w-1/2">{totals.current.toLocaleString()} sessions</div> 
          <div className={`font-bold flex justify-end w-1/2 ${totals.percent === null ? 'text-gray-400' : totals.percent > 0 ? 'text-green-600' : totals.percent < 0 ? 'text-red-500' : ''}`}>
            {totals.percent === null ? '—' : (
              <span className="inline-flex items-center gap-1">
                {totals.percent > 0 && <ArrowUpRight size={14} className="inline" />}
                {totals.percent < 0 && <ArrowDownRight size={14} className="inline" />}
                {Math.abs(totals.percent).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 