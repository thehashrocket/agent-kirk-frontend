/**
 * @file src/components/admin/admin-satisfaction-metrics.tsx
 * Admin satisfaction metrics component that displays system-wide or client-specific satisfaction data.
 * Similar to the account-rep satisfaction metrics but with admin-level access.
 */

import { getSystemDetailedSatisfactionMetrics } from "@/lib/admin-client-reports";
import { AdminSatisfactionMetricsClient } from "./admin-satisfaction-metrics-client";

interface AdminSatisfactionMetricsProps {
  selectedClientId?: string;
}

export async function AdminSatisfactionMetrics({ selectedClientId }: AdminSatisfactionMetricsProps) {
  const metrics = await getSystemDetailedSatisfactionMetrics(selectedClientId);

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
    <AdminSatisfactionMetricsClient
      metrics={metrics}
      distributionData={distributionData}
      formattedTrendData={formattedTrendData}
      selectedClientId={selectedClientId}
    />
  );
}