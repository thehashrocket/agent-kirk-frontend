'use client';

import { Card } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/trend-chart";
import { getDetailedSatisfactionMetrics } from "@/lib/account-rep";

interface SatisfactionMetricsProps {
  accountRepId: string;
}

export async function SatisfactionMetrics({ accountRepId }: SatisfactionMetricsProps) {
  const metrics = await getDetailedSatisfactionMetrics(accountRepId);

  // Calculate distribution percentages for the bar chart
  const totalRatings = Object.values(metrics.ratingDistribution).reduce((a, b) => a + b, 0);
  const distributionData = Object.entries(metrics.ratingDistribution).map(([rating, count]) => ({
    rating: Number(rating),
    count,
    percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
  }));

  // Format trend data to ensure dates are strings
  const formattedTrendData = metrics.trend.map(item => ({
    ...item,
    date: item.date.toISOString().split('T')[0],
  }));

  return (
    <div className="grid gap-6">
      {/* Overview Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Client Satisfaction Overview</h2>
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
                tooltipFormatter={(value) => value ? `${value.toFixed(1)} stars` : 'No data'}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Feedback Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Client Feedback</h2>
        <div className="space-y-4">
          {metrics.recentFeedback.map((feedback, index) => (
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
              <p className="text-sm text-gray-500 mt-1">- {feedback.clientName}</p>
            </div>
          ))}
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
                <span className="text-gray-500">{item.percentage}%</span>
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
      </Card>
    </div>
  );
} 