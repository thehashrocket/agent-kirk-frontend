'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { GaMetricsResponse } from '@/lib/types/ga-metrics';

interface GaMetricsGridProps {
  data: GaMetricsResponse;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function MetricCard({ title, value, description }: { title: string; value: string; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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

export function GaMetricsGrid({ data }: GaMetricsGridProps) {
  const { kpiDaily, kpiMonthly, channelDaily, sourceDaily } = data;

  if (!kpiDaily && !kpiMonthly && !channelDaily && !sourceDaily) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="daily" className="space-y-6">
      <TabsList>
        <TabsTrigger value="daily">Daily Metrics</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Metrics</TabsTrigger>
        <TabsTrigger value="channels">Channel Performance</TabsTrigger>
        <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
      </TabsList>

      <TabsContent value="daily">
        {kpiDaily && kpiDaily.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Sessions"
              value={kpiDaily[0]?.sessions?.toLocaleString?.() ?? '—'}
              description="Total daily sessions"
            />
            <MetricCard
              title="Page Views per Session"
              value={kpiDaily[0]?.screenPageViewsPerSession?.toFixed?.(2) ?? '—'}
              description="Average page views"
            />
            <MetricCard
              title="Engagement Rate"
              value={kpiDaily[0] ? formatPercentage(kpiDaily[0].engagementRate) : '—'}
              description="User engagement"
            />
            <MetricCard
              title="Avg. Session Duration"
              value={kpiDaily[0] ? formatDuration(kpiDaily[0].avgSessionDurationSec) : '—'}
              description="Time spent per session"
            />
            <MetricCard
              title="Goal Completions"
              value={kpiDaily[0]?.goalCompletions?.toLocaleString?.() ?? '—'}
              description="Total conversions"
            />
            <MetricCard
              title="Goal Completion Rate"
              value={kpiDaily[0] ? formatPercentage(kpiDaily[0].goalCompletionRate) : '—'}
              description="Conversion rate"
            />
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No daily metrics available</p>
        )}
      </TabsContent>

      <TabsContent value="monthly">
        {kpiMonthly && kpiMonthly.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Monthly Sessions"
              value={kpiMonthly[0]?.sessions?.toLocaleString?.() ?? '—'}
              description="Total monthly sessions"
            />
            <MetricCard
              title="Page Views per Session"
              value={kpiMonthly[0]?.screenPageViewsPerSession?.toFixed?.(2) ?? '—'}
              description="Average page views"
            />
            <MetricCard
              title="Engagement Rate"
              value={kpiMonthly[0] ? formatPercentage(kpiMonthly[0].engagementRate) : '—'}
              description="User engagement"
            />
            <MetricCard
              title="Avg. Session Duration"
              value={kpiMonthly[0] ? formatDuration(kpiMonthly[0].avgSessionDurationSec) : '—'}
              description="Time spent per session"
            />
            <MetricCard
              title="Goal Completions"
              value={kpiMonthly[0]?.goalCompletions?.toLocaleString?.() ?? '—'}
              description="Total conversions"
            />
            <MetricCard
              title="Goal Completion Rate"
              value={kpiMonthly[0] ? formatPercentage(kpiMonthly[0].goalCompletionRate) : '—'}
              description="Conversion rate"
            />
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No monthly metrics available</p>
        )}
      </TabsContent>

      <TabsContent value="channels">
        {channelDaily && channelDaily.length > 0 ? (
          <div className="space-y-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channelGroup" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#2563EB" name="Sessions" />
                  <Bar dataKey="goalCompletions" fill="#10B981" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channelDaily.map((channel) => (
                <Card key={channel.channelGroup}>
                  <CardHeader>
                    <CardTitle className="text-sm">{channel.channelGroup}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt>Sessions:</dt>
                        <dd>{channel.sessions.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Engagement Rate:</dt>
                        <dd>{formatPercentage(channel.engagementRate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Conversions:</dt>
                        <dd>{channel.goalCompletions.toLocaleString()}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No channel data available</p>
        )}
      </TabsContent>

      <TabsContent value="sources">
        {sourceDaily && sourceDaily.length > 0 ? (
          <div className="space-y-6">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trafficSource" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#2563EB" name="Sessions" />
                  <Bar dataKey="goalCompletions" fill="#10B981" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sourceDaily.map((source) => (
                <Card key={source.trafficSource}>
                  <CardHeader>
                    <CardTitle className="text-sm">{source.trafficSource}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt>Sessions:</dt>
                        <dd>{source.sessions.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Engagement Rate:</dt>
                        <dd>{formatPercentage(source.engagementRate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Conversions:</dt>
                        <dd>{source.goalCompletions.toLocaleString()}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No source data available</p>
        )}
      </TabsContent>
    </Tabs>
  );
} 