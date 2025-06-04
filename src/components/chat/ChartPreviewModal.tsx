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
import { useChartData } from '@/hooks/use-chart-data';
import { SessionsPieChart } from './Charts/SessionPieChart';
import { ParsedQuerySummaryChart } from './Charts/ParsedQuerySummaryChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParsedQueryDataChart } from './Charts/ParsedQueryDataChart';

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

  // Add debugging logs

  if (error) {
    console.log('ChartPreviewModal - Error:', error);
  }

  // Check if all data arrays are empty - if so, don't render the component
  if (data && 
      (!data.parsedQueryData || data.parsedQueryData.length === 0) &&
      (!data.parsedQuerySummary || data.parsedQuerySummary.length === 0) &&
      (!data.parsedPieGraphData || data.parsedPieGraphData.length === 0)) {
    return null;
  }

  // Only process data if it exists
  const pieData = data?.parsedPieGraphData ? getTopSources(data.parsedPieGraphData, 5) : [];

  if (error) {
    return null;
  }

  console.log('[ChartPreviewModal] Data:', data);

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
        ) : !data ? (
          <div className="h-[400px] flex items-center justify-center">
            <p>No data available</p>
          </div>
        ) : (
          <div className="space-y-8">
            <Tabs defaultValue="query">
              <TabsList>
                <TabsTrigger value="query">Sessions Over Time</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="pie">Sessions by Source</TabsTrigger>
              </TabsList>
              <TabsContent value="query">
                {data.parsedQueryData && <ParsedQueryDataChart queryData={data.parsedQueryData} />}
              </TabsContent>
              <TabsContent value="summary">
                {data.parsedQuerySummary && <ParsedQuerySummaryChart summaryData={data.parsedQuerySummary} />}
              </TabsContent>
              <TabsContent value="pie">
                {pieData.length > 0 && <SessionsPieChart data={pieData} />}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 