'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import type { SproutSocialMetricsResponse } from './types';
import { computeMetrics } from './types';
import {
  SproutSocialMetricsOverview,
  SproutSocialPlatformCharts,
  SproutSocialDemographicsChart,
  createDemographicsConfig,
  transformDemographicData,
  type DemographicData,
} from './components';

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
  onDateRangeChange?: (dateRange: { from: Date; to: Date }) => void;
}

// Mock demographic data for demonstration (would come from API in real implementation)
const generateMockDemographics = (platformType: string): {
  ageData: DemographicData[];
  locationData: DemographicData[];
} => {
  // This would typically come from the API response
  const mockAgeData: DemographicData[] = [
    { category: '65+', value: 24 },
    { category: '55-64', value: 89 },
    { category: '45-54', value: 156 },
    { category: '35-44', value: 234 },
    { category: '25-34', value: 187 },
    { category: '18-24', value: 98 },
  ];

  const mockLocationData: DemographicData[] = [
    { category: 'San Francisco, CA', value: 445 },
    { category: 'New York, NY', value: 387 },
    { category: 'Los Angeles, CA', value: 334 },
    { category: 'Chicago, IL', value: 256 },
    { category: 'Austin, TX', value: 189 },
    { category: 'Seattle, WA', value: 156 },
    { category: 'Denver, CO', value: 134 },
    { category: 'Miami, FL', value: 98 },
    { category: 'Boston, MA', value: 87 },
    { category: 'Atlanta, GA', value: 76 },
  ];

  return { ageData: mockAgeData, locationData: mockLocationData };
};

export function SproutSocialEnhancedDashboard({ 
  data, 
  onDateRangeChange 
}: SproutSocialEnhancedDashboardProps) {
  // Move useState to the top level
  const [showDebug, setShowDebug] = useState(false);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            No SproutSocial Account Selected
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
      {/* Debug Panel for LinkedIn */}
      {data.platformType.toLowerCase() === 'linkedin' && (
        <div className="mb-6 border rounded-lg bg-gray-50 p-4">
          <button
            className="mb-2 text-xs text-blue-600 underline"
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? 'Hide' : 'Show'} Debug: Raw LinkedIn Metrics
          </button>
          {showDebug && (
            <div className="overflow-x-auto text-xs bg-white border rounded p-2 max-h-96">
              <div className="mb-2 font-semibold">Current Period Metrics:</div>
              <pre className="mb-4 whitespace-pre-wrap break-all">
                {JSON.stringify(data.metrics, null, 2)}
              </pre>
              <div className="mb-2 font-semibold">Comparison Period Metrics:</div>
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(data.comparisonMetrics, null, 2)}
              </pre>
              {(!data.metrics || data.metrics.length === 0) && (
                <div className="text-red-600 mt-2">No LinkedIn metrics data returned from API.</div>
              )}
              {data.metrics && data.metrics.length > 0 && data.metrics.every(m => Object.values(m).every(v => v === 0 || v === null)) && (
                <div className="text-yellow-600 mt-2">All LinkedIn metric values are zero or null.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {data.account.name} Performance
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize text-sm">
              {data.platformType}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(parseISO(data.dateRange.start), 'MMM d, yyyy')} - {format(parseISO(data.dateRange.end), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
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
            <p className="font-medium capitalize">{data.platformType}</p>
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
        {data.account.link && (
          <div className="mt-4">
            <a 
              href={data.account.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View Profile on {data.platformType} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 