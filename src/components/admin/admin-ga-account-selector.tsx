/**
 * @file src/components/admin/admin-ga-account-selector.tsx
 * Admin version of GA Account Selector that allows selecting accounts/properties for a specific client.
 * Used by administrators to access any client's Google Analytics data.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

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

interface AdminGaAccountSelectorProps {
  clientId: string;
  onAccountChange?: (accountId: string | null) => void;
  onPropertyChange?: (propertyId: string | null) => void;
  onAccountObjectChange?: (account: GaAccount | null) => void;
  onPropertyObjectChange?: (property: GaProperty | null) => void;
}

/**
 * @component AdminGaAccountSelector
 * Admin version of GA account selector for selecting client's GA accounts and properties.
 * 
 * Features:
 * - Fetches GA accounts for a specific client
 * - Two-stage selection: Account → Property
 * - Auto-selects first available account and property
 * - Provides callbacks for selection changes
 * 
 * @param {AdminGaAccountSelectorProps} props - Component props
 */
export function AdminGaAccountSelector({
  clientId,
  onAccountChange,
  onPropertyChange,
  onAccountObjectChange,
  onPropertyObjectChange,
}: AdminGaAccountSelectorProps) {
  const [accounts, setAccounts] = useState<GaAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts for the specified client
  useEffect(() => {
    const fetchClientAccounts = async () => {
      if (!clientId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/client-ga-accounts?clientId=${clientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch client GA accounts');
        }
        const data = await response.json();
        const fetchedAccounts = data.gaAccounts || [];
        setAccounts(fetchedAccounts);

        // Auto-select first account and property if available
        if (fetchedAccounts.length > 0) {
          const firstAccount = fetchedAccounts[0];
          setSelectedAccountId(firstAccount.id);
          onAccountChange?.(firstAccount.id);
          onAccountObjectChange?.(firstAccount);

          if (firstAccount.gaProperties.length > 0) {
            const firstProperty = firstAccount.gaProperties[0];
            setSelectedPropertyId(firstProperty.id);
            onPropertyChange?.(firstProperty.id);
            onPropertyObjectChange?.(firstProperty);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientAccounts();
  }, [clientId, onAccountChange, onPropertyChange, onAccountObjectChange, onPropertyObjectChange]);

  // Reset selections when client changes
  useEffect(() => {
    setAccounts([]);
    setSelectedAccountId(null);
    setSelectedPropertyId(null);
    setError(null);
    onAccountChange?.(null);
    onPropertyChange?.(null);
    onAccountObjectChange?.(null);
    onPropertyObjectChange?.(null);
  }, [clientId, onAccountChange, onPropertyChange, onAccountObjectChange, onPropertyObjectChange]);

  // Handle account selection
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    setSelectedPropertyId(null); // Reset property selection
    onAccountChange?.(accountId);
    onPropertyChange?.(null);

    const selectedAccount = accounts.find(acc => acc.id === accountId) || null;
    onAccountObjectChange?.(selectedAccount);

    // Auto-select first property of the selected account
    if (selectedAccount && selectedAccount.gaProperties.length > 0) {
      const firstProperty = selectedAccount.gaProperties[0];
      setSelectedPropertyId(firstProperty.id);
      onPropertyChange?.(firstProperty.id);
      onPropertyObjectChange?.(firstProperty);
    } else {
      onPropertyObjectChange?.(null);
    }
  };

  // Handle property selection
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    onPropertyChange?.(propertyId);
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    const selectedProperty = selectedAccount?.gaProperties.find(prop => prop.id === propertyId) || null;
    onPropertyObjectChange?.(selectedProperty);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Loading GA accounts...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">
            No Google Analytics accounts found for this client
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className="space-y-4">
      <Select value={selectedAccountId || ''} onValueChange={handleAccountChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select Google Analytics Account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.gaAccountName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAccount && (
        <Select value={selectedPropertyId || ''} onValueChange={handlePropertyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Google Analytics Property" />
          </SelectTrigger>
          <SelectContent>
            {selectedAccount.gaProperties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.gaPropertyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 