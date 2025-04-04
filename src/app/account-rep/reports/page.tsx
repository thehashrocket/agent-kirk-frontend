'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/components/ui/use-toast';
import { Activity } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { LlmQueryMetrics } from '@/components/reports/LlmQueryMetrics';

function MetricCard({ title, value, description }: { title: string; value: string | number; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6 space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function AccountRepReportsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    return {
      from: startOfDay(thirtyDaysAgo),
      to: endOfDay(now),
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<any>(null);

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setDateRange(range);
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (range?.from) {
        searchParams.set('startDate', range.from.toISOString().split('T')[0]);
      }
      if (range?.to) {
        searchParams.set('endDate', range.to.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/reports/llm-metrics?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetricsData(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch metrics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (session?.user?.email) {
      handleDateRangeChange(dateRange);
    }
  }, [session?.user?.email]);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Please sign in to view reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">LLM Query Reports</h1>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </div>
      ) : metricsData ? (
        <LlmQueryMetrics data={metricsData} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Select a date range to view metrics</p>
        </div>
      )}
    </div>
  );
} 