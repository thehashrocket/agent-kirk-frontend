'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import type { AccountRepReportData } from '@/lib/services/reports';

interface ReportChartsProps {
  data: AccountRepReportData;
  previousPeriodData?: AccountRepReportData;
}

export function ReportCharts({ data, previousPeriodData }: ReportChartsProps) {
  // Calculate performance changes
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  const performanceChanges = previousPeriodData ? {
    satisfactionChange: calculateChange(
      data.metrics.clientSatisfactionScore,
      previousPeriodData.metrics.clientSatisfactionScore
    ),
    resolutionRateChange: calculateChange(
      data.performanceMetrics.ticketResolutionRate,
      previousPeriodData.performanceMetrics.ticketResolutionRate
    ),
    responseTimeChange: calculateChange(
      data.metrics.averageResponseTime,
      previousPeriodData.metrics.averageResponseTime
    ),
    retentionRateChange: calculateChange(
      data.clientEngagement.retentionRate,
      previousPeriodData.clientEngagement.retentionRate
    ),
  } : null;

  // Prepare data for satisfaction trend chart
  const satisfactionData = data.activities.map(activity => ({
    date: format(new Date(activity.timestamp), 'MMM dd'),
    satisfaction: data.metrics.clientSatisfactionScore,
    resolution: data.performanceMetrics.ticketResolutionRate,
  })).reverse();

  // Prepare data for client engagement chart
  const engagementData = [
    {
      name: 'Active Today',
      value: data.clientEngagement.activeClientsToday,
      fill: '#4f46e5',
    },
    {
      name: 'Total Clients',
      value: data.metrics.totalClients,
      fill: '#818cf8',
    },
    {
      name: 'Avg Interactions',
      value: Math.round(data.clientEngagement.averageClientInteractions),
      fill: '#c7d2fe',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfaction"
                  name="Satisfaction Score"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="resolution"
                  name="Resolution Rate"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {performanceChanges && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Satisfaction</p>
                <p className={`font-medium ${Number(performanceChanges.satisfactionChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceChanges.satisfactionChange}%
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Resolution Rate</p>
                <p className={`font-medium ${Number(performanceChanges.resolutionRateChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceChanges.resolutionRateChange}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Client Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {performanceChanges && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Response Time</p>
                <p className={`font-medium ${Number(performanceChanges.responseTimeChange) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceChanges.responseTimeChange}%
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Retention Rate</p>
                <p className={`font-medium ${Number(performanceChanges.retentionRateChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performanceChanges.retentionRateChange}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 