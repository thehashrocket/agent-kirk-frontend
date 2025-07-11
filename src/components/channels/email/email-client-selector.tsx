/**
 * @file src/components/channels/email/email-client-selector.tsx
 * Email Client selector component for choosing from available Email Clients.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Fetch user's Email Clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/client/email-clients');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Email Clients');
        }

        const clientsData = await response.json();
        setClients(clientsData);

        // Auto-select first client if available
        if (clientsData.length > 0) {
          const firstClient = clientsData[0];
          setSelectedClientId(firstClient.id);
          onClientChange(firstClient.id);
          onClientObjectChange(firstClient);
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
  }, [onClientChange, onClientObjectChange]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const selectedClient = clients.find(client => client.id === clientId) || null;
    onClientChange(clientId);
    onClientObjectChange(selectedClient);
  };

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
      </CardContent>
    </Card>
  );
} 