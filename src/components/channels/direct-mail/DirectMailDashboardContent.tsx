/**
 * @file src/components/channels/direct-mail/DirectMailDashboardContent.tsx
 * Direct/USPS dashboard content component that manages shared state between direct mail analytics and print functionality.
 * This component lifts up the selected account state so both DirectMailMetrics and DirectMailPrintButton can access it.
 */

'use client';

import { useState, useEffect } from 'react';
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
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch user's Direct Mail accounts and auto-select the first one
    useEffect(() => {
        const fetchAndSelectFirstAccount = async () => {
            try {
                const response = await fetch('/api/client/direct-mail-accounts');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch Direct Mail Accounts');
                }
                const accounts = await response.json();

                // Auto-select the first account if available and none is currently selected
                if (accounts.length > 0 && !selectedAccountId) {
                    setSelectedAccountId(accounts[0].id);
                }
                setIsInitialized(true);
            } catch (error) {
                console.error('Error fetching Direct Mail accounts:', error);
                setIsInitialized(true);
            }
        };
        if (!isInitialized) {
            fetchAndSelectFirstAccount();
        }
    }, [selectedAccountId, isInitialized]);


    return (
        <div className="space-y-6">
            {/* Header with Print Button */}
            <div className="flex justify-end">
                <DirectMailPrintButton selectedAccountId={selectedAccountId} />
            </div>

            {/* Direct Mail Analytics Content */}
            <DirectMailMetrics
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
            />
        </div>
    );
}
