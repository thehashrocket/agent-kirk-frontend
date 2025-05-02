import { Card, CardContent } from '@/components/ui/card';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TableSortable, TableColumn } from '@/components/ui/TableSortable';
import React from 'react';

interface GaChannelSessionsTableProps {
  channelDaily: GaMetricsResponse['channelDaily'];
}

// Helper to extract YYYYMM from a date string (YYYY-MM-DD)
function getYearMonth(date: string) {
  return date.slice(0, 7).replace('-', '');
}

export function GaChannelSessionsTable({ channelDaily }: GaChannelSessionsTableProps) {
  // Move hooks to top-level
  const [sort, setSort] = React.useState<{ accessor: string; direction: 'asc' | 'desc' }>({ accessor: 'sessions', direction: 'desc' });

  const allRows = React.useMemo(() => {
    if (!channelDaily || channelDaily.length === 0) return [];
    // Group by year-month
    const sessionsByMonth: Record<string, Record<string, number>> = {};
    channelDaily.forEach(row => {
      const ym = getYearMonth((row as any).date || '');
      if (!ym) return;
      if (!sessionsByMonth[ym]) sessionsByMonth[ym] = {};
      sessionsByMonth[ym][row.channelGroup] = (sessionsByMonth[ym][row.channelGroup] || 0) + row.sessions;
    });
    // Find the most recent month (YYYYMM as string)
    const months = Object.keys(sessionsByMonth).sort().reverse();
    const currentMonth = months[0];
    const prevYearMonth = (parseInt(currentMonth) - 100).toString();
    // Get channel groups for current and previous year month
    const currentData = sessionsByMonth[currentMonth] || {};
    const prevData = sessionsByMonth[prevYearMonth] || {};
    return Object.entries(currentData)
      .map(([channel, sessions]) => {
        const prev = prevData[channel] || 0;
        const diff = sessions - prev;
        const percent = prev ? (diff / Math.abs(prev)) * 100 : null;
        return { channel, sessions, percent };
      });
  }, [channelDaily]);

  // For grand total, we still need prevData for the topRows
  // So, recompute prevData for the most recent month
  let prevData: Record<string, number> = {};
  if (channelDaily && channelDaily.length > 0) {
    const sessionsByMonth: Record<string, Record<string, number>> = {};
    channelDaily.forEach(row => {
      const ym = getYearMonth((row as any).date || '');
      if (!ym) return;
      if (!sessionsByMonth[ym]) sessionsByMonth[ym] = {};
      sessionsByMonth[ym][row.channelGroup] = (sessionsByMonth[ym][row.channelGroup] || 0) + row.sessions;
    });
    const months = Object.keys(sessionsByMonth).sort().reverse();
    const prevYearMonth = (parseInt(months[0]) - 100).toString();
    prevData = sessionsByMonth[prevYearMonth] || {};
  }

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

  // Grand total for top 6
  const totalSessions = topRows.reduce((sum, r) => sum + r.sessions, 0);
  const prevTotal = topRows.reduce((sum, r) => sum + (prevData[r.channel] || 0), 0);
  const totalDiff = totalSessions - prevTotal;
  const totalPercent = prevTotal ? (totalDiff / Math.abs(prevTotal)) * 100 : null;

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
          <span className="font-bold">{totalSessions.toLocaleString()}</span>
          <span className={`font-bold ${totalPercent === null ? 'text-gray-400' : totalPercent > 0 ? 'text-green-600' : totalPercent < 0 ? 'text-red-500' : ''}`}>
            {totalPercent === null ? '—' : (
              <span className="inline-flex items-center gap-1">
                {totalPercent > 0 && <ArrowUpRight size={14} className="inline" />} 
                {totalPercent < 0 && <ArrowDownRight size={14} className="inline" />} 
                {Math.abs(totalPercent).toFixed(1)}%
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
} 