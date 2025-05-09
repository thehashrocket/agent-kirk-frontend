/**
 * @file src/components/reports/report-content.tsx
 * Client component that displays various analytics and reporting components.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionBreakdown } from "@/components/reports/action-breakdown";
import { ActivityTimeline } from "@/components/reports/activity-timeline";
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: number;
  description: string;
  format?: "number" | "percentage" | "duration" | "ms";
}

function MetricsCard({ title, value, description, format = "number" }: MetricsCardProps) {
  const formatValue = (val: number, fmt: typeof format) => {
    switch (fmt) {
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "duration":
        return `${Math.floor(val / 60)}m ${val % 60}s`;
      case "ms":
        return `${val}ms`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value, format)}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-pulse rounded bg-muted mb-2" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function ReportContent() {
  const { data, error, isLoading } = useSWR('/api/reports', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p>Failed to load report data. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricsSkeleton />
            <MetricsSkeleton />
            <MetricsSkeleton />
            <MetricsSkeleton />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Users"
            value={data.metrics.totalUsers}
            description="All registered users"
          />
          <MetricsCard
            title="Active Users"
            value={data.metrics.activeUsers}
            description="Users active in last 30 days"
          />
          <MetricsCard
            title="Total Actions"
            value={data.metrics.totalActions}
            description="Actions performed today"
          />
          <MetricsCard
            title="Error Rate"
            value={data.metrics.errorRate}
            description="Average error rate"
            format="percentage"
          />
        </div>
      </section>

      {/* System Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4">System Performance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="CPU Usage"
            value={data.performanceMetrics.cpu}
            description="Current CPU utilization"
            format="percentage"
          />
          <MetricsCard
            title="Memory Usage"
            value={data.performanceMetrics.memory}
            description="Current memory usage"
            format="percentage"
          />
          <MetricsCard
            title="Response Time"
            value={data.performanceMetrics.responseTime}
            description="Average response time"
            format="ms"
          />
          <MetricsCard
            title="Error Rate"
            value={data.performanceMetrics.errorRate}
            description="System error rate"
            format="percentage"
          />
        </div>
      </section>

      {/* User Engagement */}
      <section>
        <h2 className="text-xl font-semibold mb-4">User Engagement</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricsCard
            title="Daily Active Users"
            value={data.userEngagement.dailyActiveUsers}
            description="Users active today"
          />
          <MetricsCard
            title="Avg. Session Duration"
            value={data.userEngagement.averageSessionDuration}
            description="Time spent per session"
            format="duration"
          />
          <MetricsCard
            title="Retention Rate"
            value={data.userEngagement.retentionRate}
            description="30-day retention"
            format="percentage"
          />
        </div>
      </section>

      {/* Action Breakdown */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Action Analysis</h2>
        <Card>
          <CardContent className="p-6">
            <ActionBreakdown data={data.actions} />
          </CardContent>
        </Card>
      </section>

      {/* Activity Timeline */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <ActivityTimeline activities={data.activities} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
} 