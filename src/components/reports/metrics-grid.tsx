/**
 * @file src/components/reports/metrics-grid.tsx
 * Grid component for displaying key metrics in the client activity report.
 */

import { Card } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface ActivityMetric {
  label: string;
  value: number;
  change: number;
}

interface MetricsGridProps {
  data?: {
    totalActivities: ActivityMetric;
    successRate: ActivityMetric;
    averageTime: ActivityMetric;
    uniqueActions: ActivityMetric;
  };
}

export function MetricsGrid({ data }: MetricsGridProps) {
  if (!data) return null;

  const metrics = [
    {
      ...data.totalActivities,
      formatValue: (value: number) => value.toLocaleString(),
    },
    {
      ...data.successRate,
      formatValue: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      ...data.averageTime,
      formatValue: (value: number) => `${value.toFixed(2)}s`,
    },
    {
      ...data.uniqueActions,
      formatValue: (value: number) => value.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <p className="text-2xl font-bold">{metric.formatValue(metric.value)}</p>
            <div className="flex items-center space-x-2">
              {metric.change > 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  metric.change > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(metric.change)}%
              </span>
              <span className="text-sm text-gray-500">vs. last period</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 