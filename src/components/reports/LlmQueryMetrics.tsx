'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { LlmQueryMetrics } from '@/lib/services/reports';

interface LlmQueryMetricsProps {
  data: LlmQueryMetrics;
}

function RatingBadge({ rating }: { rating: number }) {
  let color = 'bg-gray-100 text-gray-700';
  let label = 'Neutral';

  if (rating === 1) {
    color = 'bg-green-100 text-green-700';
    label = 'Positive';
  } else if (rating === -1) {
    color = 'bg-red-100 text-red-700';
    label = 'Negative';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export function LlmQueryMetrics({ data }: LlmQueryMetricsProps) {
  const { overall, recentQueries, ratingTrend, clientSatisfaction } = data;

  // Calculate percentages for the donut chart
  const total = overall.totalQueries;
  const ratingDistribution = [
    {
      name: 'Positive',
      value: overall.positiveRatings,
      percentage: ((overall.positiveRatings / total) * 100).toFixed(1),
      color: '#10B981',
    },
    {
      name: 'Neutral',
      value: overall.neutralRatings,
      percentage: ((overall.neutralRatings / total) * 100).toFixed(1),
      color: '#6B7280',
    },
    {
      name: 'Negative',
      value: overall.negativeRatings,
      percentage: ((overall.negativeRatings / total) * 100).toFixed(1),
      color: '#EF4444',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overall.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overall.averageRating.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Scale: -1 to 1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((overall.positiveRatings / total) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overall.positiveRatings} positive ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {((overall.negativeRatings / total) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overall.negativeRatings} negative ratings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[-1, 1]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  stroke="#2563EB"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Client Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>Client Satisfaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientSatisfaction}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="clientName" />
                <YAxis domain={[-1, 1]} />
                <Tooltip />
                <Bar dataKey="averageRating" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQueries.map((query, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{query.clientName}</span>
                  <RatingBadge rating={query.rating} />
                </div>
                <p className="text-sm text-gray-600">{query.content}</p>
                <p className="text-sm text-gray-500">{query.response}</p>
                <p className="text-xs text-gray-400">
                  {new Date(query.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 