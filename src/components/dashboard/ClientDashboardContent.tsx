/**
 * @file src/components/dashboard/ClientDashboardContent.tsx
 * Client dashboard content component that manages shared state between analytics and print functionality.
 * This component lifts up the selected property state so both GaMetrics and PrintButton can access it.
 */

'use client';

import { useState } from 'react';
import GaMetrics from '@/components/analytics/GaMetrics';
import { PrintButton } from '@/components/dashboard/PrintButton';

/**
 * @component ClientDashboardContent
 * Manages shared state between the analytics display and print functionality.
 * 
 * Features:
 * - Manages selected GA property state
 * - Passes property selection down to GaMetrics component
 * - Passes selected property to PrintButton for correct print data
 * - Coordinates between analytics display and print functionality
 */
export function ClientDashboardContent() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header with Print Button */}
      <div className="flex justify-end">
        <PrintButton selectedPropertyId={selectedPropertyId} />
      </div>
      
      {/* Analytics Content */}
      <GaMetrics 
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />
    </div>
  );
} 