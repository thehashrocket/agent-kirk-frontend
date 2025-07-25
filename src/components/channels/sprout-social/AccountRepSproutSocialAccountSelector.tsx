/**
 * @file src/components/channels/sprout-social/AccountRepSproutSocialAccountSelector.tsx
 * Account Rep version of SproutSocial account selector for selecting assigned client's SproutSocial accounts.
 * Based on the client SproutSocial account selector but uses the account-rep API endpoint.
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles account rep SproutSocial account selection
 * - Open/Closed: Extensible for different account types
 * - Liskov Substitution: Compatible with other account selectors
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
import type { SproutSocialAccount } from './types';
import { normalizeNames } from '@/lib/utils/normalize-names';

interface AccountRepSproutSocialAccountSelectorProps {
  clientId: string;
  onAccountChange: (accountId: string | null) => void;
  onAccountObjectChange: (account: SproutSocialAccount | null) => void;
}

/**
 * @component AccountRepSproutSocialAccountSelector
 * Account Rep version of SproutSocial account selector for selecting assigned client's SproutSocial accounts.
 * 
 * Features:
 * - Fetches SproutSocial accounts for assigned clients only
 * - Account selection with network type display
 * - Auto-selects first available account
 * - Provides callbacks for selection changes
 * 
 * @param {AccountRepSproutSocialAccountSelectorProps} props - Component props
 */
export function AccountRepSproutSocialAccountSelector({
  clientId,
  onAccountChange,
  onAccountObjectChange,
}: AccountRepSproutSocialAccountSelectorProps) {
  const [accounts, setAccounts] = useState<SproutSocialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch SproutSocial accounts for the client
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!clientId) {
        setAccounts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/account-rep/client-sprout-social-accounts?clientId=${clientId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Social Media accounts');
        }

        const accountsData = await response.json();
        setAccounts(accountsData);

        // Auto-select first account if available
        if (accountsData.length > 0 && !selectedAccountId) {
          const firstAccount = accountsData[0];
          setSelectedAccountId(firstAccount.id);
          onAccountChange(firstAccount.id);
          onAccountObjectChange(firstAccount);
        }
      } catch (error) {
        console.error('Error fetching Social Media accounts:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch Social Media accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [clientId, selectedAccountId, onAccountChange, onAccountObjectChange]);

  // Handle account selection
  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
    onAccountChange(accountId);
    
    const selectedAccount = accounts.find(account => account.id === accountId);
    onAccountObjectChange(selectedAccount || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading Social Media accounts...</span>
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

  if (accounts.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No Social Media accounts found for this client
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Select Social Media Account
        </label>
        <Select value={selectedAccountId || ''} onValueChange={handleAccountSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a Social Media account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{account.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {normalizeNames(account.networkType)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedAccountId && (
        <div className="p-3 bg-blue-50 rounded-lg border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-sm text-blue-900">
                {accounts.find(acc => acc.id === selectedAccountId)?.name}
              </h4>
              <p className="text-xs text-blue-700">
                Network: {normalizeNames(accounts.find(acc => acc.id === selectedAccountId)?.networkType || '')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 