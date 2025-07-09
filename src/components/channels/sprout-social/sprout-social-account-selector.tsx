'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { SproutSocialAccount, SproutSocialAccountSelectorProps } from './types';
import { normalizeSocialNetworkName } from '@/lib/utils/normalize-social-network-names';

/**
 * @component SproutSocialAccountSelector
 * @path src/components/channels/sprout-social/sprout-social-account-selector.tsx
 * Account selector for SproutSocial accounts associated with the current user.
 * 
 * Features:
 * - Fetches user's SproutSocial accounts from API
 * - Dropdown selection interface
 * - Loading and error states
 * - Platform type display
 * - Callback handlers for selection changes
 * 
 * @param onAccountChange - Callback when account ID changes
 * @param onAccountObjectChange - Callback when account object changes
 */
export function SproutSocialAccountSelector({
  onAccountChange,
  onAccountObjectChange,
}: SproutSocialAccountSelectorProps) {
  const [accounts, setAccounts] = useState<SproutSocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's SproutSocial accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/client/sprout-social-accounts');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch SproutSocial accounts');
        }

        const accountsData = await response.json();
        setAccounts(accountsData);

        // Auto-select first account if available
        if (accountsData.length > 0) {
          const firstAccount = accountsData[0];
          setSelectedAccountId(firstAccount.id);
          onAccountChange(firstAccount.id);
          onAccountObjectChange(firstAccount);
        } else {
          onAccountChange(null);
          onAccountObjectChange(null);
        }
      } catch (error) {
        console.error('Error fetching SproutSocial accounts:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch accounts');
        onAccountChange(null);
        onAccountObjectChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [onAccountChange, onAccountObjectChange]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    const selectedAccount = accounts.find(account => account.id === accountId) || null;
    onAccountChange(accountId);
    onAccountObjectChange(selectedAccount);
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
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-center text-muted-foreground">Loading SproutSocial accounts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">
            No SproutSocial accounts found. Please contact your account representative to set up access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label htmlFor="sprout-social-account-select" className="block text-sm font-medium mb-2">
            Select SproutSocial Account
          </label>
          <Select value={selectedAccountId || ''} onValueChange={handleAccountChange}>
            <SelectTrigger id="sprout-social-account-select">
              <SelectValue placeholder="Choose a SproutSocial account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {normalizeSocialNetworkName(account.networkType)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedAccountId && (
        <div className="text-sm text-muted-foreground">
          {accounts.find(account => account.id === selectedAccountId)?.nativeName && (
            <p>
              Native Name: {accounts.find(account => account.id === selectedAccountId)?.nativeName}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 