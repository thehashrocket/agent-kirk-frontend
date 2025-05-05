import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LineChartProps {
  data: Array<{
    date: string;
    sessions: number;
  }>;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 400 }) => {
  // Filter data to only include the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Filter and sort data by date
  const filteredData = data
    .filter(item => new Date(item.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format date for axis label (e.g., "Mar 1")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    if (value < 1000) return value.toString();
    return `${Math.floor(value / 100) * 100}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <div className="flex items-center mr-6">
          <span className="inline-block w-8 h-1 bg-orange-400 mr-2"></span>
          <span className="text-sm text-gray-600">Sessions</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart 
          data={filteredData} 
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate} 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value: any) => [value.toLocaleString(), 'Sessions']}
            labelFormatter={(label) => formatDate(label)}
            contentStyle={{ 
              borderRadius: '4px', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              border: 'none',
              padding: '8px 12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sessions" 
            stroke="#e69832" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#e69832', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
            animationBegin={0}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}; 