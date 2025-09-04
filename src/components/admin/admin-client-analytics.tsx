/**
 * @file src/components/admin/admin-client-analytics.tsx
 * Admin client analytics component that provides client selection and analytics display.
 * Allows administrators to select a client and view their Google Analytics data.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminGaMetrics } from '@/components/admin/admin-ga-metrics';
import { PrintButton } from '@/components/dashboard/PrintButton';

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

interface AdminClientAnalyticsProps {
  clientsWithGaData: ClientWithGaData[];
  selectedClientId?: string;
}

/**
 * @component AdminClientAnalytics
 * Main component for admin client analytics functionality.
 *
 * Features:
 * - Client selection dropdown with GA account information
 * - Display selected client information
 * - Google Analytics data visualization for selected client
 * - Print functionality for reports
 * - Similar UI to client dashboard but with admin-level access
 *
 * @param {AdminClientAnalyticsProps} props - Component props
 */
export function AdminClientAnalytics({
  clientsWithGaData,
  selectedClientId
}: AdminClientAnalyticsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClientChange = (clientId: string) => {
    const params = new URLSearchParams(searchParams);

    if (clientId === 'none') {
      params.delete('clientId');
    } else {
      params.set('clientId', clientId);
    }

    router.push(`/admin/client-analytics?${params.toString()}`);
  };

  const selectedClient = selectedClientId
    ? clientsWithGaData.find(client => client.id === selectedClientId)
    : null;

  // Filter clients that have GA accounts
  const clientsWithGA = clientsWithGaData.filter(client => client.gaAccounts.length > 0);

  return (
    <div className="space-y-6">
      {/* Client Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Select Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedClientId || 'none'}
            onValueChange={handleClientChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client to view analytics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                Select a client...
              </SelectItem>
              {clientsWithGA.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{client.name || client.email || 'Unknown Client'}</span>
                    <div className="flex gap-1 ml-2">
                      {!client.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {client.gaAccounts.length} GA Account{client.gaAccounts.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected Client Information */}
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
        </CardContent>
      </Card>

      {/* Analytics Display */}
      {selectedClient ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Analytics Overview - {selectedClient.name || selectedClient.email}
            </h2>
            <p className="text-gray-600">
              Google Analytics data and insights for this client
            </p>
          </div>
          <AdminGaMetrics clientId={selectedClient.id} />
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
              {clientsWithGA.length === 0 && (
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