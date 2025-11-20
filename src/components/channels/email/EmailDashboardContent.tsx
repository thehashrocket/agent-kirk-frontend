/**
 * @file src/components/channels/email/EmailDashboardContent.tsx
 * Email dashboard content component that manages shared state between email analytics and print functionality.
 * This component lifts up the selected email client state so both EmailMetrics and EmailPrintButton can access it.
 */

'use client';

import { useState } from 'react';
import EmailMetrics from './email-metrics';

/**
 * @component EmailDashboardContent
 * Manages shared state between the email analytics display and print functionality.
 *
 * Features:
 * - Manages selected email client state
 * - Auto-selects first available email client on mount
 * - Passes client selection down to EmailMetrics component
 * - Passes selected client to EmailPrintButton for correct print data
 * - Coordinates between email analytics display and print functionality
 */
export function EmailDashboardContent() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header with Print Button */}
      <div className="flex justify-end">
        {/* <EmailPrintButton selectedClientId={selectedClientId} /> */}
      </div>

      {/* Email Analytics Content */}
      <EmailMetrics
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
      />
    </div>
  );
}
