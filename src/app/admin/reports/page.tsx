/**
 * @file src/app/admin/reports/page.tsx
 * Admin reports page component that displays various analytics and reporting components.
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { ActionBreakdown } from "@/components/reports/action-breakdown";
import { ActivityTimeline } from "@/components/reports/activity-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchReportData } from "@/lib/api/reports";

export const metadata: Metadata = {
  title: "Admin Reports",
  description: "Comprehensive reports and analytics dashboard for administrators",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] w-full animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

async function ReportContent() {
  const data = await fetchReportData();

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

export default function AdminReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ReportContent />
      </Suspense>
    </div>
  );
} 