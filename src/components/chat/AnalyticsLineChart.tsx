'use client';

// import tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { ParsedQueryData, ParsedQuerySummary } from '@/prisma/generated/client';
import { ParsedQueryDataChart } from './Charts/ParsedQueryDataChart';
import { ParsedQuerySummaryChart } from './Charts/ParsedQuerySummaryChart';

interface AnalyticsLineChartProps {
  queryData: ParsedQueryData[];
  summaryData: ParsedQuerySummary[];
}

export function AnalyticsLineChart({ queryData, summaryData }: AnalyticsLineChartProps) {

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full">
        <Tabs defaultValue="query">
          <TabsList>
            <TabsTrigger value="query">Sessions Over Time</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="pie">Sessions by Source</TabsTrigger>
          </TabsList>
          <TabsContent value="query">
            <ParsedQueryDataChart queryData={queryData} />
          </TabsContent>
          <TabsContent value="summary">
            <ParsedQuerySummaryChart summaryData={summaryData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 