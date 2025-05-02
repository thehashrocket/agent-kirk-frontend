'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';
import { Info } from 'lucide-react';
import { GaChannelSessionsTable } from './GaChannelSessionsTable';
import { PieChart, PieChartData } from './PieChart';

interface GaMetricsGridProps {
  data: GaMetricsResponse;
}

export function GaMetricsGrid({ data }: GaMetricsGridProps) {
  const { kpiMonthly, channelDaily } = data;

  if (!kpiMonthly || kpiMonthly.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  // Find the most recent month
  const sorted = [...kpiMonthly].sort((a, b) => b.month - a.month);
  const current = sorted[0];

  // Find the same month last year (YYYYMM - 100)
  const prevYearMonth = current.month - 100;

  const prevYear = kpiMonthly.find(m => m.month === prevYearMonth);

  // Helper for YoY change
  function getYoY(currentVal: number, prevVal?: number) {
    if (prevVal === undefined || prevVal === 0) return null;
    const diff = currentVal - prevVal;
    const percent = (diff / Math.abs(prevVal)) * 100;
    return percent;
  }

  // Helper to extract YYYYMM from a date string (YYYY-MM-DD)
  function getYearMonth(date: string) {
    return date.slice(0, 7).replace('-', '');
  }

  // Metric definitions
  const metrics: Array<{
    key: keyof typeof current;
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
          const s = v % 60;
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

  // Shared aggregation for most recent month
  let pieData: PieChartData[] = [];
  let topRows: { channel: string; sessions: number }[] = [];
  // Sessions by Source pie chart data
  let sourcePieData: PieChartData[] = [];
  if (channelDaily && channelDaily.length > 0) {
    // Group by year-month
    const sessionsByMonth: Record<string, Record<string, number>> = {};
    channelDaily.forEach((row: any) => {
      const ym = getYearMonth(row.date || '');
      if (!ym) return;
      if (!sessionsByMonth[ym]) sessionsByMonth[ym] = {};
      sessionsByMonth[ym][row.channelGroup] = (sessionsByMonth[ym][row.channelGroup] || 0) + row.sessions;
    });
    // Find the most recent month (YYYYMM as string)
    const months = Object.keys(sessionsByMonth).sort().reverse();
    const currentMonth = months[0];
    const currentData = sessionsByMonth[currentMonth] || {};
    // Color palette (match screenshot order: Direct, Organic Search, Email, Referral, Organic Social, Unassigned)
    const colorMap: Record<string, string> = {
      'Direct': '#e69832',
      'Organic Search': '#1a3766',
      'Email': '#6b6e6e',
      'Referral': '#a6b6c6',
      'Organic Social': '#4a90e2',
      'Unassigned': '#cccccc',
    };
    // Prepare pieData and topRows
    pieData = Object.entries(currentData).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#ccc',
    })).sort((a, b) => b.value - a.value);
    topRows = pieData.map(({ name, value }) => ({ channel: name, sessions: value }));

    // --- Sessions by Source Pie Chart ---
    if (data.sourceDaily && data.sourceDaily.length > 0) {
      const sourceByMonth: Record<string, Record<string, number>> = {};
      data.sourceDaily.forEach((row: any) => {
        const ym = getYearMonth(row.date || '');
        if (!ym) return;
        if (!sourceByMonth[ym]) sourceByMonth[ym] = {};
        sourceByMonth[ym][row.trafficSource] = (sourceByMonth[ym][row.trafficSource] || 0) + row.sessions;
      });
      const sourceData = sourceByMonth[currentMonth] || {};
      // Sort sources by value
      let entries = Object.entries(sourceData).map(([name, value]) => ({ name, value }));
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
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-2">Monthly Website Traffic Overview</h2>
      <p className="text-gray-500 mb-6">Year-Over-Year Comparison</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {metrics.map(metric => {
          const value = current[metric.key];
          const prev = prevYear ? prevYear[metric.key] : undefined;
          const percent = prev !== undefined ? getYoY(value, prev) : null;
          const display = metric.format ? metric.format(value) : typeof value === 'number' ? value.toLocaleString() : value;
          // Format YoY delta for time and percent
          let deltaDisplay = '';
          if (prev !== undefined && prev !== 0) {
            if (metric.key === 'avgSessionDurationSec') {
              const diff = value - prev;
              const sign = diff > 0 ? '+' : '';
              const m = Math.floor(Math.abs(diff) / 60);
              const s = Math.abs(diff) % 60;
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
                <span className="text-3xl font-bold text-black tracking-tight">{display}</span>
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
            </div>
            <div className="flex flex-row">
              <PieChart data={sourcePieData} />
            </div>
          </div>
        )}

      </div>
      <div className="flex-1">
        <GaChannelSessionsTable channelDaily={data.channelDaily} />
      </div>
    </div>
  );
} 