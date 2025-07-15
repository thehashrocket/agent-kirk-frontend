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
import { normalizeSocialNetworkName } from '@/lib/utils/normalize-social-network-names';



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

export function SproutSocialEnhancedDashboard({ 
  data, 
  onDateRangeChange 
}: SproutSocialEnhancedDashboardProps) {

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
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
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
            <p className="font-medium capitalize">{normalizeSocialNetworkName(data.platformType)}</p>
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