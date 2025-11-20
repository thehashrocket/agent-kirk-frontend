'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { DirectMailAccount } from './types';
import {
  clearDefaultDirectMailAccountId,
  getDefaultDirectMailAccountId,
  setDefaultDirectMailAccountId,
} from '@/lib/preferences/direct-mail-account-preference';

interface DirectMailAccountSelectorProps {
  selectedAccountId: string | null;
  onAccountChange: (accountId: string | null) => void;
}

export function DirectMailAccountSelector({
  selectedAccountId,
  onAccountChange,
}: DirectMailAccountSelectorProps) {
  const [accounts, setAccounts] = useState<DirectMailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedDefaultAccountId, setStoredDefaultAccountId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (!clientId) {
          response = await fetch('/api/client/direct-mail-accounts');
        } else {
          response = await fetch(`/api/account-rep/direct-mail-accounts?clientId=${encodeURIComponent(clientId)}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Direct Mail accounts');
        }

        const accountsData: DirectMailAccount[] = await response.json();
        setAccounts(accountsData);

        if (accountsData.length === 0) {
          onAccountChange(null);
          setStoredDefaultAccountId(null);
          clearDefaultDirectMailAccountId();
          return;
        }

        const savedDefaultAccountId = getDefaultDirectMailAccountId();
        setStoredDefaultAccountId(savedDefaultAccountId);

        let nextAccount: DirectMailAccount | null = null;

        if (selectedAccountId) {
          nextAccount = accountsData.find((account) => account.id === selectedAccountId) ?? null;
        }

        if (!nextAccount && savedDefaultAccountId) {
          nextAccount = accountsData.find((account) => account.id === savedDefaultAccountId) ?? null;

          if (!nextAccount) {
            clearDefaultDirectMailAccountId();
            setStoredDefaultAccountId(null);
          }
        }

        if (!nextAccount) {
          nextAccount = accountsData[0];
        }

        if (nextAccount && nextAccount.id !== selectedAccountId) {
          onAccountChange(nextAccount.id);
        }
      } catch (err) {
        console.error('Error fetching Direct Mail accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Direct Mail accounts');
        onAccountChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [clientId, onAccountChange]);

  const toggleDefaultAccount = (checked: boolean) => {
    if (!selectedAccountId) {
      return;
    }

    if (checked) {
      setDefaultDirectMailAccountId(selectedAccountId);
      setStoredDefaultAccountId(selectedAccountId);
    } else {
      clearDefaultDirectMailAccountId();
      setStoredDefaultAccountId(null);
    }
  };

  const isDefaultSelection =
    Boolean(selectedAccountId) && selectedAccountId === storedDefaultAccountId;

  const defaultAccountName =
    storedDefaultAccountId &&
    accounts.find((account) => account.id === storedDefaultAccountId)?.clientName;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Loading Direct Mail accounts...</p>
          </div>
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
            No Direct Mail accounts found. Contact your account representative to enable access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          Direct Mail Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Account</Label>
          <Select value={selectedAccountId ?? ''} onValueChange={value => onAccountChange(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start justify-between rounded-md border border-dashed bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Default account</p>
            <p className="text-xs text-muted-foreground">
              {isDefaultSelection && defaultAccountName
                ? `${defaultAccountName} loads automatically`
                : 'Toggle to load this account by default'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="direct-mail-default-account"
              checked={isDefaultSelection}
              onCheckedChange={toggleDefaultAccount}
              disabled={!selectedAccountId}
            />
            <Label htmlFor="direct-mail-default-account" className="text-sm">
              Make default
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
