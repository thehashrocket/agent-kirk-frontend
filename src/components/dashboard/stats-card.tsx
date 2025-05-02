import { Card } from "@/components/ui/card";
import type { StatsCardProps } from "./types";

/**
 * @component StatsCard
 * @file src/components/dashboard/stats-card.tsx
 * Reusable statistics card for dashboards.
 * Features:
 * - Metric title and value
 * - Change percentage with color coding
 * - Responsive layout using Tailwind CSS
 * - Accessible and extendable
 */
export function StatsCard({ data }: StatsCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{data.title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{data.value}</p>
        <p className={`ml-2 text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.change > 0 ? '+' : ''}{data.change}%
        </p>
      </div>
    </Card>
  );
} 