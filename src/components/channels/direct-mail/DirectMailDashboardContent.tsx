/**
 * @file src/components/channels/direct-mail/DirectMailDashboardContent.tsx
 * Direct/USPS dashboard content component that manages shared state between direct mail analytics and print functionality.
 * This component lifts up the selected account state so both DirectMailMetrics and DirectMailPrintButton can access it.
 */

'use client';

import { useState, useEffect } from 'react';
import DirectMailMetrics from './direct-mail-metrics';
import { DirectMailPrintButton } from './DirectMailPrintButton';
// load user session
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

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
    const { data: session } = useSession();
    // Ensure we have a user session to work with
    const user = session?.user;
    // Get url parameters if needed
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId');

    // Fetch user's Direct Mail accounts and auto-select the first one
    useEffect(() => {
        // Check if we have a user session, if not, we can't fetch accounts
        if (!user) {
            console.warn('No user session found, skipping account fetch');
            return;
        }
        const fetchAndSelectFirstAccount = async () => {
            try {
                // If signed in user is an account rep, fetch their Direct Mail accounts
                // Otherwise, if signed in user is a client, fetch their Direct Mail accounts
                let response;
                if (!user) {
                    throw new Error('User not authenticated');
                } else if (user.role === 'ADMIN') {
                    // Admin user fetching all Direct Mail accounts
                    // Pass the clientId if available
                    response = await fetch(`/api/admin/direct-mail-accounts?clientId=${encodeURIComponent(clientId || '')}`);
                } else if (user.role === 'CLIENT') {
                    // Client user fetching their Direct Mail accounts
                    response = await fetch('/api/client/direct-mail-accounts');
                } else if (user.role === 'ACCOUNT_REP') {
                    // Account Rep user fetching their Direct Mail accounts
                    response = await fetch(`/api/account-rep/direct-mail-accounts?clientId=${encodeURIComponent(clientId || '')}`);
                } else {
                    throw new Error('Unauthorized user role');
                }
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
    }, [selectedAccountId, isInitialized, user]);


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
