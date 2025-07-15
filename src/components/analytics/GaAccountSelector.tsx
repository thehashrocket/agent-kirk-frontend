/**
 * @file src/components/analytics/GaAccountSelector.tsx
 * Component for selecting Google Analytics accounts and their properties.
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

interface GaAccountSelectorProps {
  onAccountChange?: (accountId: string | null) => void;
  onPropertyChange?: (propertyId: string | null) => void;
  onAccountObjectChange?: (account: GaAccount | null) => void;
  onPropertyObjectChange?: (property: GaProperty | null) => void;
}

export function GaAccountSelector({
  onAccountChange,
  onPropertyChange,
  onAccountObjectChange,
  onPropertyObjectChange,
}: GaAccountSelectorProps) {
  const [accounts, setAccounts] = useState<GaAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        
        // Transform the nested userToGaAccounts data into the expected format
        const fetchedAccounts = data.userToGaAccounts?.map((userToGaAccount: any) => ({
          id: userToGaAccount.gaAccount.id,
          gaAccountId: userToGaAccount.gaAccount.gaAccountId,
          gaAccountName: userToGaAccount.gaAccount.gaAccountName,
          gaProperties: userToGaAccount.gaAccount.gaProperties.map((property: any) => ({
            id: property.id,
            gaPropertyId: property.gaPropertyId,
            gaPropertyName: property.gaPropertyName
          }))
        })) || [];

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

    fetchAccounts();
  }, [onAccountChange, onPropertyChange, onAccountObjectChange, onPropertyObjectChange]);

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
          <p className="text-center text-muted-foreground">Loading accounts...</p>
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
          <p className="text-center text-muted-foreground">No Google Analytics accounts found</p>
        </CardContent>
      </Card>
    );
  }

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <div className="space-y-4">
      {/* if there is only one account, don't show the select */}
      {accounts.length === 1 ? (
        <p className="text-sm text-muted-foreground">
          Account: {accounts[0].gaAccountName}
        </p>
      ) : (
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
      )}
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