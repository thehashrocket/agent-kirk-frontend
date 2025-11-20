/**
 * @file src/components/channels/direct-mail/DirectMailDashboardContent.tsx
 * Direct/USPS dashboard content component that manages shared state between direct mail analytics and print functionality.
 * This component lifts up the selected account state so both DirectMailMetrics and DirectMailPrintButton can access it.
 */

'use client';

import { useState } from 'react';
import DirectMailMetrics from './direct-mail-metrics';
import { DirectMailPrintButton } from './DirectMailPrintButton';

/**
 * @component DirectMailDashboardContent
 * Manages shared state between the direct mail analytics display and print functionality.
 *
 * Features:
 * - Manages selected Direct Mail account state
 * - Auto-selects first available account on mount
 * - Passes account selection down to DirectMailMetrics component
 * - Passes selected account to DirectMailPrintButton for correct print data
 * - Coordinates between direct mail analytics display and print functionality
 */

export function DirectMailDashboardContent() {
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {/* Header with Print Button */}
            <div className="flex justify-end">
                {/* <DirectMailPrintButton selectedAccountId={selectedAccountId} /> */}
            </div>

            {/* Direct Mail Analytics Content */}
            <DirectMailMetrics
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
            />
        </div>
    );
}
