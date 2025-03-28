'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import type { AccountRepReportData } from '@/lib/services/reports';
import type { DateRange } from 'react-day-picker';
import { ReportCharts } from '@/components/reports/ReportCharts';
import { SatisfactionMetrics } from '@/components/reports/SatisfactionMetrics';

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px]" />
        <Skeleton className="mt-1 h-3 w-[140px]" />
      </CardContent>
    </Card>
  );
}

export default function AccountRepReportsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    return {
      from: startOfDay(thirtyDaysAgo),
      to: endOfDay(now),
    };
  });
  const [reportData, setReportData] = useState<AccountRepReportData | null>(null);
  const [previousPeriodData, setPreviousPeriodData] = useState<AccountRepReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportData = async (startDate: Date, endDate: Date, isPreviousPeriod: boolean = false) => {
    if (!session?.user?.email) return;

    try {
      // Convert to UTC dates
      const utcStartDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00Z');
      const utcEndDate = new Date(endDate.toISOString().split('T')[0] + 'T23:59:59.999Z');

      const response = await fetch('/api/reports/account-rep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: format(utcStartDate, 'yyyy-MM-dd'),
          endDate: format(utcEndDate, 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      if (isPreviousPeriod) {
        setPreviousPeriodData(data);
      } else {
        setReportData(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch report data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDateRangeChange = async (newDateRange: DateRange | undefined) => {
    // Use the provided date range or default to the current one
    const effectiveRange = newDateRange || dateRange;
    setDateRange(effectiveRange);
    setIsLoading(true);

    try {
      if (effectiveRange.from && effectiveRange.to) {
        // Ensure we're working with the correct dates by using startOfDay and endOfDay
        const start = startOfDay(effectiveRange.from);
        const end = endOfDay(effectiveRange.to);
        
        // Fetch current period data
        await fetchReportData(start, end);

        // Calculate and fetch previous period data
        const daysDiff = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        const previousPeriodEnd = subDays(start, 1);
        const previousPeriodStart = subDays(previousPeriodEnd, daysDiff - 1); // Adjust to maintain same period length
        await fetchReportData(previousPeriodStart, previousPeriodEnd, true);
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Account Rep Reports</h1>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : reportData ? (
          <>
            <MetricCard
              title="Total Clients"
              value={reportData.metrics.totalClients}
              description={`${reportData.metrics.activeClients} active clients`}
            />
            <MetricCard
              title="Client Satisfaction"
              value={`${reportData.metrics.clientSatisfactionScore.toFixed(1)}/5`}
            />
            <MetricCard
              title="Ticket Resolution Rate"
              value={`${reportData.performanceMetrics.ticketResolutionRate.toFixed(1)}%`}
            />
            <MetricCard
              title="Average Response Time"
              value={`${(reportData.metrics.averageResponseTime / 60).toFixed(1)}m`}
            />
          </>
        ) : null}
      </div>

      {reportData && (
        <>
          <div className="mt-8">
            <ReportCharts data={reportData} previousPeriodData={previousPeriodData ?? undefined} />
          </div>

          <div className="mt-8">
            <SatisfactionMetrics data={reportData} />
          </div>
        </>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4 pr-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : reportData?.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.clientName} - {activity.description}
                    </p>
                  </div>
                  <div className={`text-sm ${
                    activity.status === 'success'
                      ? 'text-green-600'
                      : activity.status === 'error'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Client Engagement</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Clients Today</span>
                  <span className="font-medium">{reportData.clientEngagement.activeClientsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Interactions</span>
                  <span className="font-medium">
                    {reportData.clientEngagement.averageClientInteractions.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retention Rate</span>
                  <span className="font-medium">
                    {reportData.clientEngagement.retentionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 