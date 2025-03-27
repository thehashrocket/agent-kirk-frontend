/**
 * @file src/app/reports/client-activity/page.tsx
 * Client activity reports page that displays detailed metrics about client usage and engagement.
 * Features filtering by date range and activity type.
 */

'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useClientActivity } from "@/hooks/use-client-activity";
import { ActivityTimeline } from "@/components/reports/activity-timeline";
import { MetricsGrid } from "@/components/reports/metrics-grid";
import { ActionBreakdown } from "@/components/reports/action-breakdown";
import { addDays } from "date-fns";

const activityTypes = [
  { value: "all", label: "All Activities" },
  { value: "query", label: "Queries" },
  { value: "login", label: "Logins" },
  { value: "settings", label: "Settings Changes" },
  { value: "export", label: "Data Exports" },
];

export default function ClientActivityPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [activityType, setActivityType] = useState("all");

  const { data, isLoading } = useClientActivity({
    startDate: dateRange.from,
    endDate: dateRange.to,
    type: activityType,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Activity Report</h1>
        <p className="text-gray-600">
          Track and analyze client engagement and usage patterns
        </p>
      </div>

      <Card className="p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type
            </label>
            <Select
              value={activityType}
              onValueChange={setActivityType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                // Handle report export
              }}
            >
              Export Report
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 mb-8">
        <MetricsGrid data={data?.metrics} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
          <ActivityTimeline activities={data?.activities || []} />
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Action Breakdown</h2>
          <ActionBreakdown data={data?.actionBreakdown || []} />
        </Card>
      </div>
    </div>
  );
} 