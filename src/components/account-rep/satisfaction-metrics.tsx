import { Card } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/trend-chart";
import { getDetailedSatisfactionMetrics } from "@/lib/account-rep";
import { SatisfactionMetricsClient } from "./satisfaction-metrics-client";

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
    <SatisfactionMetricsClient 
      metrics={metrics}
      distributionData={distributionData}
      formattedTrendData={formattedTrendData}
    />
  );
} 