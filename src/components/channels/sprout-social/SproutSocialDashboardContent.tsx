/**
 * @file src/components/channels/sprout-social/SproutSocialDashboardContent.tsx
 * SproutSocial dashboard content component that manages shared state between social analytics and print functionality.
 * This component lifts up the selected account state so both SproutSocialMetrics and SproutSocialPrintButton can access it.
 */

'use client';

import { useState, useEffect } from 'react';
import SproutSocialMetrics from './sprout-social-metrics';
import { SproutSocialPrintButton } from './SproutSocialPrintButton';

/**
 * @component SproutSocialDashboardContent
 * Manages shared state between the social analytics display and print functionality.
 * 
 * Features:
 * - Manages selected SproutSocial account state
 * - Auto-selects first available account on mount
 * - Passes account selection down to SproutSocialMetrics component
 * - Passes selected account to SproutSocialPrintButton for correct print data
 * - Coordinates between social analytics display and print functionality
 */
export function SproutSocialDashboardContent() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user's SproutSocial accounts and auto-select the first one
  useEffect(() => {
    const fetchAndSelectFirstAccount = async () => {
      try {
        const response = await fetch('/api/client/sprout-social-accounts');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch SproutSocial Accounts');
        }
        
        const accounts = await response.json();
        
        // Auto-select the first account if available and none is currently selected
        if (accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].id);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching SproutSocial accounts:', error);
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
        <SproutSocialPrintButton selectedAccountId={selectedAccountId} />
      </div>
      
      {/* Social Analytics Content */}
      <SproutSocialMetrics 
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
      />
    </div>
  );
} 