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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  clearDefaultGaPropertyId,
  getDefaultGaPropertyId,
  setDefaultGaPropertyId,
} from '@/lib/preferences/ga-property-preference';

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
  const [storedDefaultPropertyId, setStoredDefaultPropertyId] = useState<string | null>(null);

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
        const fetchedAccounts: GaAccount[] = data.userToGaAccounts?.map((userToGaAccount: any) => ({
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

        if (fetchedAccounts.length > 0) {
          const savedPropertyId = getDefaultGaPropertyId();
          setStoredDefaultPropertyId(savedPropertyId);

          let matchedSavedDefault = false;
          let nextAccount: GaAccount | null = fetchedAccounts[0] ?? null;
          let nextProperty: GaProperty | null =
            nextAccount?.gaProperties.length ? nextAccount.gaProperties[0] : null;

          if (savedPropertyId) {
            for (const account of fetchedAccounts) {
              const propertyMatch = account.gaProperties.find(
                (property) => property.id === savedPropertyId
              );

              if (propertyMatch) {
                matchedSavedDefault = true;
                nextAccount = account;
                nextProperty = propertyMatch;
                break;
              }
            }
          }

          if (savedPropertyId && !matchedSavedDefault) {
            clearDefaultGaPropertyId();
            setStoredDefaultPropertyId(null);
          }

          if (nextAccount) {
            setSelectedAccountId(nextAccount.id);
            onAccountChange?.(nextAccount.id);
            onAccountObjectChange?.(nextAccount);

            if (nextProperty) {
              setSelectedPropertyId(nextProperty.id);
              onPropertyChange?.(nextProperty.id);
              onPropertyObjectChange?.(nextProperty);
            } else {
              onPropertyChange?.(null);
              onPropertyObjectChange?.(null);
            }
          }
        } else {
          onAccountChange?.(null);
          onPropertyChange?.(null);
          onAccountObjectChange?.(null);
          onPropertyObjectChange?.(null);
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

  const toggleDefaultProperty = (checked: boolean) => {
    if (!selectedPropertyId) {
      return;
    }

    if (checked) {
      setDefaultGaPropertyId(selectedPropertyId);
      setStoredDefaultPropertyId(selectedPropertyId);
    } else {
      clearDefaultGaPropertyId();
      setStoredDefaultPropertyId(null);
    }
  };

  const isDefaultSelection =
    Boolean(selectedPropertyId) && selectedPropertyId === storedDefaultPropertyId;

  const defaultPropertyName =
    storedDefaultPropertyId &&
    accounts
      .flatMap((account) => account.gaProperties)
      .find((property) => property.id === storedDefaultPropertyId)?.gaPropertyName;

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
  const hasProperties = Boolean(selectedAccount && selectedAccount.gaProperties.length);

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
      {hasProperties && selectedAccount && (
        <div className="space-y-3 rounded-md border border-border p-3">
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

          <div className="flex items-start justify-between rounded-md border border-dashed bg-muted/50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Default property</p>
              <p className="text-xs text-muted-foreground">
                {isDefaultSelection && defaultPropertyName
                  ? `${defaultPropertyName} loads by default`
                  : 'Toggle to load this property automatically next time'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="ga-default-property"
                checked={isDefaultSelection}
                onCheckedChange={toggleDefaultProperty}
                disabled={!selectedPropertyId}
              />
              <Label htmlFor="ga-default-property" className="text-sm">
                Make default
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
