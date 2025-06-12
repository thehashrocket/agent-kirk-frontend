/**
 * @file src/components/admin/admin-satisfaction-metrics-client.tsx
 * Client component for admin satisfaction metrics display.
 * Handles the rendering of satisfaction data for system-wide or client-specific views.
 */

'use client';

import { Card } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/trend-chart";
import type { SystemSatisfactionMetrics } from "@/lib/admin-client-reports";

interface AdminSatisfactionMetricsClientProps {
  metrics: SystemSatisfactionMetrics;
  distributionData: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  formattedTrendData: Array<{
    date: string;
    rating: number;
    count: number;
  }>;
  selectedClientId?: string;
}

export function AdminSatisfactionMetricsClient({ 
  metrics, 
  distributionData, 
  formattedTrendData,
  selectedClientId 
}: AdminSatisfactionMetricsClientProps) {
  const title = selectedClientId 
    ? "Client Satisfaction Metrics" 
    : "System-wide Satisfaction Overview";

  return (
    <div className="grid gap-6">
      {/* Overview Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.averageRating.toFixed(1)}
              <span className="ml-2">
                {metrics.averageRating >= 4.5 ? '🌟' : 
                 metrics.averageRating >= 4.0 ? '⭐' : 
                 metrics.averageRating >= 3.0 ? '😊' : '😕'}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Ratings</p>
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.totalRatings.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">30-Day Trend</p>
            <div className="h-16">
              <TrendChart
                data={formattedTrendData}
                dataKey="rating"
                height={64}
                color="#10B981"
                showGrid
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Feedback Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Client Feedback</h2>
        <div className="space-y-4">
          {metrics.recentFeedback.length > 0 ? (
            metrics.recentFeedback.map((feedback, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg font-medium">{feedback.rating.toFixed(1)}</span>
                    <span className="ml-2">
                      {feedback.rating >= 4.5 ? '🌟' : 
                       feedback.rating >= 4.0 ? '⭐' : 
                       feedback.rating >= 3.0 ? '😊' : '😕'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{feedback.feedback}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">- {feedback.clientName}</p>
                  {feedback.accountRepName && (
                    <p className="text-xs text-gray-400">
                      Rep: {feedback.accountRepName}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent feedback available</p>
              <p className="text-sm">
                {selectedClientId 
                  ? "This client hasn't provided feedback recently."
                  : "No clients have provided feedback recently."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Rating Distribution Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
        <div className="space-y-3">
          {distributionData.sort((a, b) => b.rating - a.rating).map((item) => (
            <div key={item.rating} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.rating} stars</span>
                <span className="text-gray-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.rating >= 4 ? '#10B981' : 
                                   item.rating >= 3 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-sm text-blue-900 mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">
                Positive Ratings (4-5 ⭐): 
                <span className="font-semibold ml-1">
                  {distributionData
                    .filter(d => d.rating >= 4)
                    .reduce((sum, d) => sum + d.percentage, 0)}%
                </span>
              </p>
            </div>
            <div>
              <p className="text-blue-700">
                Average Score: 
                <span className="font-semibold ml-1">
                  {metrics.averageRating.toFixed(1)}/5.0
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 