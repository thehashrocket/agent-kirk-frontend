import { Card } from "@/components/ui/card";
import { getOverallSatisfactionMetrics, getSatisfactionTrend } from "@/lib/admin";
import { TrendChart } from "@/components/ui/trend-chart";

export async function SatisfactionOverview() {
  const [metrics, trendData] = await Promise.all([
    getOverallSatisfactionMetrics(),
    getSatisfactionTrend(),
  ]);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Client Satisfaction Overview</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.averageRating.toFixed(1)}
            </p>
            <span className={`ml-2 text-sm ${
              metrics.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.percentageChange > 0 ? '+' : ''}{metrics.percentageChange}%
            </span>
          </div>
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
              data={trendData}
              dataKey="rating"
              height={64}
              color="#10B981"
            />
          </div>
        </div>
      </div>
    </Card>
  );
} 