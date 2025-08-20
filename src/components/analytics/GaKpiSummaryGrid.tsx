import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import CountUp from 'react-countup';

/**
 * GaKpiSummaryGrid
 *
 * Renders the six KPI summary cards for the analytics dashboard.
 * Props:
 *   - current: the selected month object from kpiMonthly
 *   - prevYear: the previous year month object from kpiMonthly
 */
interface GaKpiSummaryGridProps {
  current: any;
  prevYear: any;
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
      tooltip: 'Total number of sessions for the entire month.'
    },
    {
      key: 'goalCompletions',
      label: 'Goal Completions',
      tooltip: 'Number of goal completions for the entire month.'
    },
    {
      key: 'goalCompletionRate',
      label: 'Goal Completion Rate',
      tooltip: 'Goal completions per session for the entire month.',
      format: (v: number) => `${(v * 100).toFixed(2)}%`
    }
  ];

function ensureNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getYoY(currentVal: number, prevVal?: number) {
  if (prevVal === undefined || prevVal === 0) return null;
  const diff = currentVal - prevVal;
  const percent = (diff / Math.abs(prevVal)) * 100;
  return percent;
}

export function GaKpiSummaryGrid({ current, prevYear }: GaKpiSummaryGridProps) {
  if (!current) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      <h2 className="col-span-full text-xl font-bold mb-4">Key Performance Indicators For Whole Month </h2>
      {metrics.map(metric => {
        let value: number = 0;
        let prev: number | undefined = undefined;
        // For goalCompletionRate, calculate from goalCompletions / sessions
        if (metric.key === 'goalCompletionRate') {
          value = current && current.sessions ? ensureNumber(current.goalCompletions) / ensureNumber(current.sessions) : 0;
          prev = prevYear && prevYear.sessions ? ensureNumber(prevYear.goalCompletions) / ensureNumber(prevYear.sessions) : undefined;
        } else {
          value = current ? ensureNumber(current[metric.key as keyof typeof current]) : 0;
          prev = prevYear ? ensureNumber(prevYear[metric.key as keyof typeof prevYear]) : undefined;
        }
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
  );
}