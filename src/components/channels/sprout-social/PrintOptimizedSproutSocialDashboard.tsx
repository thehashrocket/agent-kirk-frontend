/**
 * @file src/components/channels/sprout-social/PrintOptimizedSproutSocialDashboard.tsx
 * Print-optimized version of the SproutSocialEnhancedDashboard component.
 * Displays social analytics data without interactive controls, optimized for printing.
 */

'use client';

import React from 'react';
import dayjs from 'dayjs';
import type { SproutSocialMetricsResponse } from './types';
import { computeMetrics } from './types';
import {
  SproutSocialMetricsOverview,
  SproutSocialPlatformCharts,
  SproutSocialDemographicsChart,
  createDemographicsConfig,
} from './components';
import { normalizeNames } from '@/lib/utils/normalize-names';

interface PrintOptimizedSproutSocialDashboardProps {
  data: SproutSocialMetricsResponse;
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

/**
 * PrintOptimizedSproutSocialDashboard Component
 *
 * Purpose:
 *   - Displays social analytics dashboard data in a print-friendly format
 *   - No interactive controls (date pickers, selectors)
 *   - Clean layout optimized for printing
 *   - Includes all charts and data visualizations
 *
 * Props:
 *   - data: Social analytics data to display (see SproutSocialMetricsResponse type)
 */
export function PrintOptimizedSproutSocialDashboard({ data }: PrintOptimizedSproutSocialDashboardProps) {
  // Set up date range from data
  const dateRange = React.useMemo(() => {
    if (data?.dateRange?.from) {
      return getFullMonthRange(data.dateRange.from);
    }
    return null;
  }, [data?.dateRange?.from]);

  // Transform the metrics using the same logic as the regular dashboard
  const { current: currentMetrics, comparison: comparisonMetrics } = React.useMemo(() => {
    return computeMetrics(data.metrics, data.comparisonMetrics);
  }, [data.metrics, data.comparisonMetrics]);

  // Transform demographic data for charts (if available)
  const transformedDemographics = React.useMemo(() => {
    // Skip demographics if not available in data
    return { ageData: [], locationData: [] };
  }, []);

  const { ageData, locationData } = transformedDemographics;

  return (
    <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0 social-metrics">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Social Media Performance</h1>
        <h2 className="text-xl font-bold mb-2">
          {normalizeNames(data.platformType)} Analytics Overview
        </h2>
        <p className="text-gray-500 mb-2">
          {dateRange
            ? `${dayjs(dateRange.from).format('MMM D, YYYY')} - ${dayjs(dateRange.to).format('MMM D, YYYY')}`
            : `${dayjs(data.dateRange.from).format('MMM D, YYYY')} - ${dayjs(data.dateRange.to).format('MMM D, YYYY')}`
          }
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Showing social media metrics with period comparison
        </p>
      </div>

      {/* Page Activity Overview */}
      <div className="avoid-break mb-8">
        <h2 className="text-xl font-semibold mb-1">Page Activity Overview</h2>
        <p className="text-sm text-muted-foreground mb-4">Previous Period Comparison</p>
        <SproutSocialMetricsOverview
          currentMetrics={currentMetrics}
          comparisonMetrics={comparisonMetrics}
          platformType={data.platformType}
        />
      </div>

      {/* Platform-specific Charts */}
      <div className="avoid-break mt-8">
        <SproutSocialPlatformCharts
          data={data.metrics}
          comparisonData={data.comparisonMetrics}
          platformType={data.platformType}
          currentMetrics={currentMetrics}
          dateRange={data.dateRange}
        />
      </div>

      {/* Demographics Section */}
      <div className="grid gap-6 lg:grid-cols-2 mt-8 page-break">
        {/* Age Demographics */}
        {ageData.length > 0 && (
          <div className="avoid-break">
            <SproutSocialDemographicsChart
              data={ageData}
              config={createDemographicsConfig.age(ageData)}
            />
          </div>
        )}

        {/* Location Demographics */}
        {locationData.length > 0 && (
          <div className="avoid-break">
            <SproutSocialDemographicsChart
              data={locationData}
              config={createDemographicsConfig.location(locationData)}
            />
          </div>
        )}
      </div>

      {/* Summary Information */}
      <div className="mt-8 page-break">
        <h2 className="text-lg font-bold mb-4">Report Summary</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Platform</h3>
            <p className="text-sm text-gray-600">{normalizeNames(data.platformType)}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Data Period</h3>
            <p className="text-sm text-gray-600">
              {dayjs(data.dateRange.from).format('MMM D, YYYY')} - {dayjs(data.dateRange.to).format('MMM D, YYYY')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}