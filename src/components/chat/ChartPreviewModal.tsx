'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useChartData } from '@/hooks/use-chart-data';
import { SessionsPieChart } from './SessionPieChart';

interface ChartPreviewModalProps {
  queryId: string;
}

export function getTopSources(data: any, max = 5) {
  const sorted = [...data].sort((a, b) => b.sessions - a.sessions);
  const top = sorted.slice(0, max);
  const other = sorted.slice(max);

  const otherTotal = other.reduce((sum, item) => sum + item.sessions, 0);

  if (otherTotal > 0) {
    top.push({
      channel: 'Other',
      sessions: otherTotal,
    });
  }

  return top;
}



export function ChartPreviewModal({ queryId }: ChartPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useChartData(open ? queryId : null);

  const pieData = getTopSources(data.parsedPieGraphData, 5);

  if (error) {
    return null;
  }

  console.log('data.parsedPieGraphData', data.parsedPieGraphData);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          📊 View Charts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Query Analytics</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Line Chart - Sessions over time */}
            <div className="space-y-2">
              <h3 className="font-medium">Sessions Over Time</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.parsedQueryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                      angle={-45}
                      textAnchor="end"
                      interval={30}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                      name="Sessions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart - Sessions by source */}
            <SessionsPieChart data={pieData} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 