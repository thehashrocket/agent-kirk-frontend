/**
 * @file src/components/channels/email/EmailDashboardContent.tsx
 * Email dashboard content component that manages shared state between email analytics and print functionality.
 * This component lifts up the selected email client state so both EmailMetrics and EmailPrintButton can access it.
 */

'use client';

import { useState, useEffect } from 'react';
import EmailMetrics from './email-metrics';
import { EmailPrintButton } from './EmailPrintButton';
import { useSearchParams } from 'next/navigation';

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
  const [isInitialized, setIsInitialized] = useState(false);
  // Get url parameters if needed
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  // Fetch user's email clients and auto-select the first one
  useEffect(() => {
    const fetchAndSelectFirstClient = async () => {
      try {
        let response;
        if (!clientId) {
          // If no clientId is provided, fetch all email clients
          response = await fetch('/api/client/email-clients');
        } else {
          // If clientId is provided, fetch specific email client
          response = await fetch(`/api/account-rep/email-clients?clientId=${encodeURIComponent(clientId)}`);
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Email Clients');
        }

        const emailClients = await response.json();

        // Auto-select the first email client if available and none is currently selected
        if (emailClients.length > 0 && !selectedClientId) {
          setSelectedClientId(emailClients[0].id);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching email clients:', error);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      fetchAndSelectFirstClient();
    }
  }, [selectedClientId, isInitialized]);

  return (
    <div className="space-y-6">
      {/* Header with Print Button */}
      <div className="flex justify-end">
        <EmailPrintButton selectedClientId={selectedClientId} />
      </div>

      {/* Email Analytics Content */}
      <EmailMetrics
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
      />
    </div>
  );
}