/**
 * @file src/components/channels/email/AccountRepEmailClientSelector.tsx
 * Account Rep version of Email client selector for selecting assigned client's email clients.
 * Based on the client Email client selector but uses the account-rep API endpoint.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles account rep email client selection
 * - Open/Closed: Extensible for different client types
 * - Liskov Substitution: Compatible with other client selectors
 * - Interface Segregation: Uses specific interfaces for its needs
 * - Dependency Inversion: Depends on abstractions (API endpoints) not concretions
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { EmailClient } from './types';

interface AccountRepEmailClientSelectorProps {
  clientId: string;
  onClientChange: (clientId: string | null) => void;
  onClientObjectChange: (client: EmailClient | null) => void;
}

/**
 * @component AccountRepEmailClientSelector
 * Account Rep version of Email client selector for selecting assigned client's email clients.
 * 
 * Features:
 * - Fetches email clients for assigned clients only
 * - Email client selection with client name display
 * - Auto-selects first available email client
 * - Provides callbacks for selection changes
 * 
 * @param {AccountRepEmailClientSelectorProps} props - Component props
 */
export function AccountRepEmailClientSelector({
  clientId,
  onClientChange,
  onClientObjectChange,
}: AccountRepEmailClientSelectorProps) {
  const [emailClients, setEmailClients] = useState<EmailClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch email clients for the client
  useEffect(() => {
    const fetchEmailClients = async () => {
      if (!clientId) {
        setEmailClients([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/account-rep/client-email-clients?clientId=${clientId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch email clients');
        }

        const emailClientsData = await response.json();
        setEmailClients(emailClientsData);

        // Auto-select first email client if available
        if (emailClientsData.length > 0 && !selectedClientId) {
          const firstEmailClient = emailClientsData[0];
          setSelectedClientId(firstEmailClient.id);
          onClientChange(firstEmailClient.id);
          onClientObjectChange(firstEmailClient);
        }
      } catch (error) {
        console.error('Error fetching email clients:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch email clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmailClients();
  }, [clientId, selectedClientId, onClientChange, onClientObjectChange]);

  // Handle email client selection
  const handleEmailClientSelect = (emailClientId: string) => {
    setSelectedClientId(emailClientId);
    onClientChange(emailClientId);
    
    const selectedEmailClient = emailClients.find(client => client.id === emailClientId);
    onClientObjectChange(selectedEmailClient || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading email clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (emailClients.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No email clients found for this client
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Select Email Client
        </label>
        <Select value={selectedClientId || ''} onValueChange={handleEmailClientSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an email client" />
          </SelectTrigger>
          <SelectContent>
            {emailClients.map((emailClient) => (
              <SelectItem key={emailClient.id} value={emailClient.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{emailClient.clientName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClientId && (
        <div className="p-3 bg-blue-50 rounded-lg border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-sm text-blue-900">
                {emailClients.find(client => client.id === selectedClientId)?.clientName}
              </h4>
              <p className="text-xs text-blue-700">
                Email Client
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 