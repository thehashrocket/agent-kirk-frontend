/**
 * @file src/components/account-rep/account-rep-client-analytics.tsx
 * Account Rep client analytics component that allows account reps to select and view their assigned clients' analytics.
 * Provides the same analytics view as the admin dashboard but restricted to the account rep's clients.
 * 
 * Features:
 * - Client selection dropdown (only account rep's clients)
 * - Google Analytics account and property selection for the chosen client
 * - SproutSocial analytics for the chosen client
 * - Email analytics for the chosen client
 * - Analytics data display matching the admin dashboard experience
 * - Print functionality for reports
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PrintButton } from '@/components/dashboard/PrintButton';
import { AccountRepGaMetrics } from '@/components/account-rep/account-rep-ga-metrics';
import { AccountRepSproutSocialMetrics } from '@/components/channels/sprout-social/AccountRepSproutSocialMetrics';
import { AccountRepEmailMetrics } from '@/components/channels/email/AccountRepEmailMetrics';

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

interface ClientWithGaData {
  id: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
  gaAccounts: GaAccount[];
  accountRep?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface AccountRepClientAnalyticsProps {
  clientsWithGaData: ClientWithGaData[];
  selectedClientId?: string;
}

/**
 * @component AccountRepClientAnalytics
 * @path src/components/account-rep/account-rep-client-analytics.tsx
 * Client analytics component for account representatives.
 * 
 * Features:
 * - Client selection dropdown (filtered to account rep's clients only)
 * - Google Analytics account and property selection for the chosen client
 * - Analytics data display matching the admin dashboard experience
 * - Print functionality for reports
 * - URL state management for selected client
 * 
 * @param {AccountRepClientAnalyticsProps} props - Component props
 * @param {ClientWithGaData[]} props.clientsWithGaData - Array of clients with their GA data
 * @param {string} [props.selectedClientId] - Optional pre-selected client ID
 */
export function AccountRepClientAnalytics({
  clientsWithGaData,
  selectedClientId
}: AccountRepClientAnalyticsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentClientId, setCurrentClientId] = useState<string>(selectedClientId || '');

  // Filter to only show clients with GA accounts
  const clientsWithGaAccounts = clientsWithGaData.filter(client => client.gaAccounts.length > 0);

  // Get the currently selected client
  const selectedClient = clientsWithGaAccounts.find(client => client.id === currentClientId);

  // Update URL when client selection changes
  const handleClientSelect = useCallback((clientId: string) => {
    setCurrentClientId(clientId);

    // Update URL with selected client
    const params = new URLSearchParams(searchParams);
    params.set('clientId', clientId);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Set initial client if none selected but clients available
  useEffect(() => {
    if (!currentClientId && clientsWithGaAccounts.length > 0) {
      handleClientSelect(clientsWithGaAccounts[0].id);
    }
  }, [currentClientId, clientsWithGaAccounts, handleClientSelect]);

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientsWithGaAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No clients with Google Analytics accounts found</p>
              <p className="text-sm">Your assigned clients haven&apos;t connected any GA accounts yet.</p>
            </div>
          ) : (
            <>
              <Select value={currentClientId} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client to view analytics" />
                </SelectTrigger>
                <SelectContent>
                  {clientsWithGaAccounts.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{client.name || client.email || 'Unknown Client'}</span>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {client.gaAccounts.length} GA Account{client.gaAccounts.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <div className="p-3 bg-blue-50 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm text-blue-900">
                        {selectedClient.name || selectedClient.email || 'Unknown Client'}
                      </h4>
                      {selectedClient.accountRep && (
                        <p className="text-xs text-blue-700">
                          Account Rep: {selectedClient.accountRep.name || selectedClient.accountRep.email}
                        </p>
                      )}
                    </div>
                    <PrintButton />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={selectedClient.isActive ? "default" : "secondary"} className="text-xs">
                      {selectedClient.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedClient.gaAccounts.length} GA Account{selectedClient.gaAccounts.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedClient.gaAccounts.reduce((total, account) => total + account.gaProperties.length, 0)} Properties
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Analytics Display */}
      {selectedClient ? (
        <div className="space-y-8">
          {/* Google Analytics Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                Google Analytics - {selectedClient.name || selectedClient.email}
              </h2>
              <p className="text-gray-600">
                Google Analytics data and insights for this client
              </p>
            </div>
            <AccountRepGaMetrics clientId={selectedClient.id} />
          </div>

          {/* SproutSocial Analytics Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                Social Media Analytics - {selectedClient.name || selectedClient.email}
              </h2>
              <p className="text-gray-600">
                SproutSocial analytics data and insights for this client
              </p>
            </div>
            <AccountRepSproutSocialMetrics clientId={selectedClient.id} />
          </div>

          {/* Email Analytics Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">
                Email Analytics - {selectedClient.name || selectedClient.email}
              </h2>
              <p className="text-gray-600">
                Email campaign analytics data and insights for this client
              </p>
            </div>
            <AccountRepEmailMetrics clientId={selectedClient.id} />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Client Selected
              </h3>
              <p className="text-gray-500 mb-4">
                Select a client from the dropdown above to view their analytics data
              </p>
              {clientsWithGaAccounts.length === 0 && (
                <p className="text-sm text-gray-400">
                  No clients with Google Analytics accounts found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 