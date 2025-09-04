'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import type { SproutSocialMetricsResponse } from './types';
import { computeMetrics } from './types';
import {
  SproutSocialMetricsOverview,
  SproutSocialPlatformCharts,
  SproutSocialDemographicsChart,
  createDemographicsConfig,
  transformDemographicData,
} from './components';
import { normalizeNames } from '@/lib/utils/normalize-names';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';



/**
 * @component SproutSocialEnhancedDashboard
 * @path src/components/channels/sprout-social/sprout-social-enhanced-dashboard.tsx
 *
 * Dependency Inversion Principle: Depends on abstractions (interfaces) not concretions
 * Single Responsibility: Orchestrates the display of comprehensive social media analytics
 *
 * Features:
 * - Comprehensive analytics matching Instagram performance report format
 * - Modular component composition
 * - Responsive layout with multiple chart types
 * - Platform-specific content adaptation
 * - Data transformation and processing abstraction
 */

interface SproutSocialEnhancedDashboardProps {
  data?: SproutSocialMetricsResponse;
  onDateRangeChange: (dateRange: { from: Date; to: Date }) => void;
}

// Utility to get first and last day of a month from any date
function getFullMonthRange(date: Date | string) {
  let year, month;
  if (typeof date === 'string') {
    // Parse as local date, not UTC, to avoid timezone issues
    const parts = date.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // JS months are 0-based
  } else {
    year = date.getFullYear();
    month = date.getMonth();
  }
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from, to };
}

// Helper: convert a UTC-based Date (or ISO string) to a local-midnight Date
const toLocalMidnight = (d: Date | string) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
};

export function SproutSocialEnhancedDashboard({
  data,
  onDateRangeChange
}: SproutSocialEnhancedDashboardProps) {
  // Add local state for date range
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Set dateRange from data on mount, using getFullMonthRange for consistent parsing
  useEffect(() => {
    if (data?.dateRange?.from) {
      setDateRange({
        from: toLocalMidnight(data.dateRange.from),
        to: toLocalMidnight(data.dateRange.to),
      });
    }
  }, [data?.dateRange?.from, data?.dateRange?.to]);

  // Handler that updates local state immediately, like EmailEnhancedDashboard
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range); // Update local state immediately
    onDateRangeChange(range);
  };

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            No Social Media Account Selected
          </h2>
          <p className="text-muted-foreground">
            Please select an account to view comprehensive analytics
          </p>
        </div>
      </div>
    );
  }

  // Compute metrics using our helper function
  const { current: currentMetrics, comparison: comparisonMetrics } = computeMetrics(
    data.metrics,
    data.comparisonMetrics
  );

  // Generate demographic data (prefer real API data if available)
  // NOTE: The demographics property must exist on the API response for these charts to render.
  // If not present, these charts will be omitted.
  const ageData = (data as any)?.demographics?.age
    ? transformDemographicData.fromAgeGroups((data as any).demographics.age)
    : [];
  const locationData = (data as any)?.demographics?.city
    ? transformDemographicData.fromLocationData((data as any).demographics.city)
    : [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {dateRange
                ? `${dayjs(dateRange.from).format('MMM D, YYYY')} - ${dayjs(dateRange.to).format('MMM D, YYYY')}`
                : `${dayjs(data.dateRange.from).format('MMM D, YYYY')} - ${dayjs(data.dateRange.to).format('MMM D, YYYY')}`
              }
            </span>
          </div>
        </div>
        {dateRange && (
          <DatePickerWithRange
            onDateChange={(date) => {
              if (date && date.from && date.to) {
                handleDateRangeChange({ from: date.from, to: date.to });
              }
            }}
            date={dateRange}
            className="w-full md:w-auto"
          />
        )}
      </div>

      {/* Page Activity Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Page Activity Overview</h2>
        <p className="text-sm text-muted-foreground mb-4">Previous Period Comparison</p>
        <SproutSocialMetricsOverview
          currentMetrics={currentMetrics}
          comparisonMetrics={comparisonMetrics}
          platformType={data.platformType}
        />
      </div>

      {/* Platform-specific Charts */}
      <SproutSocialPlatformCharts
        data={data.metrics}
        comparisonData={data.comparisonMetrics}
        platformType={data.platformType}
        currentMetrics={currentMetrics}
        dateRange={data.dateRange}
      />

      {/* Demographics Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Age Demographics */}
        {ageData.length > 0 && (
          <SproutSocialDemographicsChart
            data={ageData}
            config={createDemographicsConfig.age(ageData)}
          />
        )}

        {/* Location Demographics */}
        {locationData.length > 0 && (
          <SproutSocialDemographicsChart
            data={locationData}
            config={createDemographicsConfig.location(locationData)}
          />
        )}
      </div>

      {/* Account Information Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <span className="text-muted-foreground">Platform:</span>
            <p className="font-medium capitalize">{normalizeNames(data.platformType)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Account:</span>
            <p className="font-medium">{data.account.nativeName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data Points:</span>
            <p className="font-medium">{data.metrics.length + data.comparisonMetrics.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Report Generated:</span>
            <p className="font-medium">{format(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}