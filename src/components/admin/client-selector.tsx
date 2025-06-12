/**
 * @file src/components/admin/client-selector.tsx
 * Client selector component for admin dashboard filtering.
 * Allows administrators to view reports for all clients or filter by specific client.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface ClientSelectorProps {
  clients: ClientWithGaData[];
  selectedClientId?: string;
}

export function ClientSelector({ clients, selectedClientId }: ClientSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClientChange = (clientId: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (clientId === 'all') {
      params.delete('clientId');
    } else {
      params.set('clientId', clientId);
    }
    
    router.push(`/admin/client-reports?${params.toString()}`);
  };

  const selectedClient = selectedClientId 
    ? clients.find(client => client.id === selectedClientId)
    : null;

  const totalGaAccounts = selectedClient 
    ? selectedClient.gaAccounts.length 
    : clients.reduce((total, client) => total + client.gaAccounts.length, 0);

  const totalGaProperties = selectedClient
    ? selectedClient.gaAccounts.reduce((total, account) => total + account.gaProperties.length, 0)
    : clients.reduce((total, client) => 
        total + client.gaAccounts.reduce((accountTotal, account) => 
          accountTotal + account.gaProperties.length, 0
        ), 0
      );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Client Filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={selectedClientId || 'all'} 
          onValueChange={handleClientChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Clients ({clients.length})
            </SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{client.name || client.email || 'Unknown Client'}</span>
                  <div className="flex gap-1 ml-2">
                    {!client.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    {client.gaAccounts.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {client.gaAccounts.length} GA
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Summary Information */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500 text-xs">GA Accounts</p>
            <p className="font-semibold">{totalGaAccounts}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <p className="text-gray-500 text-xs">GA Properties</p>
            <p className="font-semibold">{totalGaProperties}</p>
          </div>
        </div>

        {/* Selected Client Info */}
        {selectedClient && (
          <div className="p-3 bg-blue-50 rounded-lg border">
            <h4 className="font-medium text-sm text-blue-900">
              {selectedClient.name || selectedClient.email || 'Unknown Client'}
            </h4>
            {selectedClient.accountRep && (
              <p className="text-xs text-blue-700">
                Account Rep: {selectedClient.accountRep.name || selectedClient.accountRep.email}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge variant={selectedClient.isActive ? "default" : "secondary"} className="text-xs">
                {selectedClient.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {selectedClient.gaAccounts.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectedClient.gaAccounts.length} GA Accounts
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 