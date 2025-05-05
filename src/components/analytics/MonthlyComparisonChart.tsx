import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface MonthlySessionData {
  month: number; // YYYYMM format
  sessions: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlySessionData[];
  height?: number;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ 
  data, 
  height = 400 
}) => {
  // Process data to create chart-friendly format with current and previous year
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get the range of months we care about (last 12 months)
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Calculate start month for filtering (12 months ago)
    const startDate = new Date(currentYear, currentMonth - 11, 1);
    const startYearMonth = startDate.getFullYear() * 100 + (startDate.getMonth() + 1);
    
    // Filter to only include the last 12 months
    const recentMonths = data
      .filter(item => item.month >= startYearMonth)
      .sort((a, b) => a.month - b.month);
    
    // If we don't have enough data, return an empty array
    if (recentMonths.length === 0) return [];
    
    // Create chart data with current year and previous year in each row
    return recentMonths.map(item => {
      // Extract year and month
      const year = Math.floor(item.month / 100);
      const month = item.month % 100;
      
      // Calculate previous year's equivalent month
      const prevYearMonth = (year - 1) * 100 + month;
      
      // Find previous year's data for this month
      const prevYearData = data.find(d => d.month === prevYearMonth);
      
      // Format month for display
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const displayDate = `${monthName} ${year}`;
      
      return {
        monthNum: item.month,
        month: displayDate,
        sessions: item.sessions || 0,
        prevYearSessions: prevYearData ? (prevYearData.sessions || 0) : 0
      };
    });
  }, [data]);

  // Format large numbers (e.g., 4000 -> 4K)
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return value.toString();
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-1 bg-blue-700 mr-1"></span>
          <span className="text-sm text-gray-600">Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-1 bg-blue-200 mr-1"></span>
          <span className="text-sm text-gray-600">Sessions (previous year)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart 
          data={processedData} 
          margin={{ top: 30, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(value) => formatValue(value)}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={(value: any) => [Number(value).toLocaleString(), '']}
            labelFormatter={(label) => label}
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
            stroke="#1a3766" 
            strokeWidth={2}
            name="Sessions"
            dot={{ r: 4, fill: '#1a3766', stroke: 'white', strokeWidth: 1 }}
            label={{
              position: 'top',
              fill: '#1a3766',
              fontSize: 12,
              formatter: (item: any) => {
                // Safe check to prevent errors with undefined values
                if (item === null || item === undefined || item.value === null || item.value === undefined) {
                  return '';
                }
                return item.value.toLocaleString();
              }
            }}
            activeDot={{ r: 6, fill: '#1a3766', stroke: 'white', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="prevYearSessions" 
            stroke="#a6c8ff" 
            strokeWidth={2}
            name="Sessions (previous year)"
            dot={{ r: 4, fill: '#a6c8ff', stroke: 'white', strokeWidth: 1 }}
            label={{
              position: 'top',
              fill: '#a6c8ff',
              fontSize: 12,
              formatter: (item: any) => {
                // Safe check to prevent errors with undefined values
                if (item === null || item === undefined || item.value === null || item.value === undefined) {
                  return '';
                }
                return item.value.toLocaleString();
              }
            }}
            activeDot={{ r: 6, fill: '#a6c8ff', stroke: 'white', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1500}
            animationBegin={300}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}; 