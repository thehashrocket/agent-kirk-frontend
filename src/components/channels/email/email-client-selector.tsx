/**
 * @file src/components/channels/email/email-client-selector.tsx
 * Email Client selector component for choosing from available Email Clients.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  clearDefaultEmailClientId,
  getDefaultEmailClientId,
  setDefaultEmailClientId,
} from '@/lib/preferences/email-client-preference';

export interface EmailClient {
  id: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailClientSelectorProps {
  onClientChange: (clientId: string | null) => void;
  onClientObjectChange: (client: EmailClient | null) => void;
}

export function EmailClientSelector({
  onClientChange,
  onClientObjectChange,
}: EmailClientSelectorProps) {
  const [clients, setClients] = useState<EmailClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedDefaultClientId, setStoredDefaultClientId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  // Fetch user's Email Clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (!clientId) {
          response = await fetch('/api/client/email-clients');
        } else {
          response = await fetch(`/api/account-rep/email-clients?clientId=${encodeURIComponent(clientId)}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Email Clients');
        }

        const clientsData: EmailClient[] = await response.json();
        setClients(clientsData);

        if (clientsData.length > 0) {
          const savedDefaultClientId = getDefaultEmailClientId();
          setStoredDefaultClientId(savedDefaultClientId);
          let nextClient: EmailClient | null = null;
          let matchedSavedDefault = false;

          if (clientId) {
            nextClient = clientsData.find(client => client.id === clientId) ?? clientsData[0];
          } else if (savedDefaultClientId) {
            nextClient = clientsData.find(client => client.id === savedDefaultClientId) ?? null;
            matchedSavedDefault = Boolean(nextClient);
          }

          if (!nextClient) {
            nextClient = clientsData[0];
          }

          if (!clientId && savedDefaultClientId && !matchedSavedDefault) {
            clearDefaultEmailClientId();
            setStoredDefaultClientId(null);
          }

          if (nextClient) {
            setSelectedClientId(nextClient.id);
            onClientChange(nextClient.id);
            onClientObjectChange(nextClient);
          }
        } else {
          onClientChange(null);
          onClientObjectChange(null);
        }
      } catch (error) {
        console.error('Error fetching Email Clients:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch clients');
        onClientChange(null);
        onClientObjectChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [onClientChange, onClientObjectChange, clientId]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find(client => client.id === clientId) || null;
    onClientChange(clientId);
    onClientObjectChange(selectedClient);
  };

  const toggleDefaultClient = (checked: boolean) => {
    if (!selectedClientId) {
      return;
    }

    if (checked) {
      setDefaultEmailClientId(selectedClientId);
      setStoredDefaultClientId(selectedClientId);
    } else {
      clearDefaultEmailClientId();
      setStoredDefaultClientId(null);
    }
  };

  const isDefaultSelection =
    Boolean(selectedClientId) && selectedClientId === storedDefaultClientId;

  const defaultClientName = storedDefaultClientId
    ? clients.find(client => client.id === storedDefaultClientId)?.clientName
    : null;

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-gray-500">No Email Clients available</p>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 1) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Client</label>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an Email Client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-start justify-between rounded-md border border-dashed bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Default client</p>
            <p className="text-xs text-muted-foreground">
              {isDefaultSelection && defaultClientName
                ? `${defaultClientName} loads by default`
                : 'Toggle to load the current client by default'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="email-default-client"
              checked={isDefaultSelection}
              onCheckedChange={toggleDefaultClient}
              disabled={!selectedClientId}
            />
            <Label htmlFor="email-default-client" className="text-sm">
              Make default
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
