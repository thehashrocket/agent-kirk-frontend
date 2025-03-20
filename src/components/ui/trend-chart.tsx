'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  dataKey: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  tooltipFormatter?: (value: any) => string;
}

export function TrendChart({
  data,
  dataKey,
  height = 100,
  color = '#0EA5E9',
  showGrid = false,
  tooltipFormatter,
}: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />
        )}
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
          stroke="#9CA3AF"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          stroke="#9CA3AF"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => tooltipFormatter ? tooltipFormatter(value) : value}
        />
        <Tooltip
          formatter={(value) => tooltipFormatter ? tooltipFormatter(value) : value}
          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 