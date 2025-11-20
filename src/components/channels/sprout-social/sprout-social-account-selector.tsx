'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import type { SproutSocialAccount, SproutSocialAccountSelectorProps } from './types';
import { normalizeNames } from '@/lib/utils/normalize-names';
import { useSearchParams } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  clearDefaultSproutSocialAccountId,
  getDefaultSproutSocialAccountId,
  setDefaultSproutSocialAccountId,
} from '@/lib/preferences/sprout-social-account-preference';

interface AccountGroupOption {
  key: string;
  name: string;
  networkType: string;
  accounts: SproutSocialAccount[];
}

/**
 * @component SproutSocialAccountSelector
 * @path src/components/channels/sprout-social/sprout-social-account-selector.tsx
 * Account selector for Social Media accounts associated with the current user.
 *
 * Features:
 * - Fetches user's Social Media accounts from API
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
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const [storedDefaultAccountId, setStoredDefaultAccountId] = useState<string | null>(null);

  // Get url parameters if needed
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  // Fetch user's Social Media accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let response;
        if (!clientId) {
          response = await fetch('/api/client/sprout-social-accounts');
        } else {
          response = await fetch(`/api/account-rep/sprout-social-accounts?clientId=${encodeURIComponent(clientId)}`);
        }


        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch Social Media accounts');
        }

        const accountsData: SproutSocialAccount[] = await response.json();
        setAccounts(accountsData);

        const savedDefaultAccountId = getDefaultSproutSocialAccountId();
        setStoredDefaultAccountId(savedDefaultAccountId);

        if (accountsData.length === 0) {
          setSelectedGroupKey(null);
          setSelectedAccountId(null);
          onAccountChange(null);
          onAccountObjectChange(null);
        } else if (savedDefaultAccountId) {
          const defaultAccount = accountsData.find((account) => account.id === savedDefaultAccountId);
          if (defaultAccount) {
            const defaultGroupKey = `${defaultAccount.name}__${defaultAccount.networkType}`;
            setSelectedGroupKey(defaultGroupKey);
            setSelectedAccountId(defaultAccount.id);
            hasInitialized.current = false;
          } else {
            clearDefaultSproutSocialAccountId();
            setStoredDefaultAccountId(null);
          }
        }
      } catch (error) {
        console.error('Error fetching Social Media accounts:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch accounts');
        setAccounts([]);
        setSelectedGroupKey(null);
        onAccountChange(null);
        onAccountObjectChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [onAccountChange, onAccountObjectChange, clientId]);

  const groupOptions = useMemo(() => {
    const groups = new Map<string, AccountGroupOption>();
    accounts.forEach((account) => {
      const key = `${account.name}__${account.networkType}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          name: account.name,
          networkType: account.networkType,
          accounts: [account],
        });
        return;
      }

      groups.get(key)!.accounts.push(account);
    });

    return Array.from(groups.values());
  }, [accounts]);

  const visibleAccounts = useMemo(() => {
    if (!selectedGroupKey) {
      return [];
    }

    const selectedGroup = groupOptions.find((group) => group.key === selectedGroupKey);
    return selectedGroup ? selectedGroup.accounts : [];
  }, [groupOptions, selectedGroupKey]);

  // Auto-select first group when groups are available and no group is selected
  useEffect(() => {
    if (groupOptions.length === 0) {
      if (selectedGroupKey !== null) {
        setSelectedGroupKey(null);
      }
      return;
    }

    // If no group is selected, select the first one
    if (!selectedGroupKey) {
      setSelectedGroupKey(groupOptions[0].key);
    } else {
      // Verify selected group still exists
      const groupExists = groupOptions.some((group) => group.key === selectedGroupKey);
      if (!groupExists) {
        setSelectedGroupKey(groupOptions[0].key);
      }
    }
  }, [groupOptions, selectedGroupKey]);

  // Auto-select account when group changes or data is loaded
  useEffect(() => {
    if (!selectedGroupKey || groupOptions.length === 0) {
      if (selectedAccountId !== null) {
        setSelectedAccountId(null);
        onAccountChange(null);
        onAccountObjectChange(null);
      }
      hasInitialized.current = false;
      return;
    }

    const selectedGroup = groupOptions.find((group) => group.key === selectedGroupKey);
    if (!selectedGroup || selectedGroup.accounts.length === 0) {
      if (selectedAccountId !== null) {
        setSelectedAccountId(null);
        onAccountChange(null);
        onAccountObjectChange(null);
      }
      hasInitialized.current = false;
      return;
    }

    // Check if current account is valid in the selected group
    const currentAccount = selectedGroup.accounts.find((account) => account.id === selectedAccountId);
    
    if (currentAccount) {
      // Account is valid - ensure callbacks are called on initial mount
      if (!hasInitialized.current) {
        onAccountChange(currentAccount.id);
        onAccountObjectChange(currentAccount);
        hasInitialized.current = true;
      }
      return;
    }

    // Current account is not valid or doesn't exist, select the first account
    const firstAccount = selectedGroup.accounts[0];
    setSelectedAccountId(firstAccount.id);
    onAccountChange(firstAccount.id);
    onAccountObjectChange(firstAccount);
    hasInitialized.current = true;
  }, [selectedGroupKey, groupOptions, selectedAccountId, onAccountChange, onAccountObjectChange]);

  const handleGroupChange = (groupKey: string) => {
    setSelectedGroupKey(groupKey);
    hasInitialized.current = false; // Reset initialization flag when group changes manually
    const group = groupOptions.find((option) => option.key === groupKey);

    if (!group || group.accounts.length === 0) {
      setSelectedAccountId(null);
      onAccountChange(null);
      onAccountObjectChange(null);
      hasInitialized.current = true; // Mark as initialized even with null account
      return;
    }

    const nextAccount = group.accounts[0];
    setSelectedAccountId(nextAccount.id);
    onAccountChange(nextAccount.id);
    onAccountObjectChange(nextAccount);
    hasInitialized.current = true; // Mark as initialized after manual selection
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    const selectedAccount = accounts.find(account => account.id === accountId) || null;
    onAccountChange(accountId);
    onAccountObjectChange(selectedAccount);
  };

  const toggleDefaultAccount = (checked: boolean) => {
    if (!selectedAccountId) {
      return;
    }

    if (checked) {
      setDefaultSproutSocialAccountId(selectedAccountId);
      setStoredDefaultAccountId(selectedAccountId);
    } else {
      clearDefaultSproutSocialAccountId();
      setStoredDefaultAccountId(null);
    }
  };

  // Get selected account for display (must be before early returns)
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((account) => account.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  const isDefaultSelection =
    Boolean(selectedAccountId) && selectedAccountId === storedDefaultAccountId;

  const defaultAccountName = useMemo(() => {
    if (!storedDefaultAccountId) return null;
    const account = accounts.find((acc) => acc.id === storedDefaultAccountId);
    if (!account) return null;
    return account.nativeName && account.nativeName !== account.name ? account.nativeName : account.name;
  }, [accounts, storedDefaultAccountId]);

  // Get selected group for display (must be before early returns)
  const selectedGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groupOptions.find((group) => group.key === selectedGroupKey) || null;
  }, [groupOptions, selectedGroupKey]);

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
            <p className="text-center text-muted-foreground">Loading Social Media accounts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupOptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">
            No Social Media accounts found. Please contact your account representative to set up access.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Don't render if only one group with one account
  if (groupOptions.length === 1 && visibleAccounts.length <= 1) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Group Selector - only show if multiple groups */}
          {groupOptions.length > 1 && (
            <div className="space-y-2">
              <label
                htmlFor="sprout-social-group-select"
                className="text-sm font-semibold text-foreground flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Profile
              </label>
              <Select value={selectedGroupKey || ''} onValueChange={handleGroupChange}>
                <SelectTrigger
                  id="sprout-social-group-select"
                  className="w-full min-h-[2.75rem] items-start bg-background py-2.5 text-left hover:bg-accent/50 transition-colors *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:items-start *:data-[slot=select-value]:text-left *:data-[slot=select-value]:flex-col"
                >
                  <SelectValue
                    placeholder="Select a profile"
                    className="whitespace-normal leading-tight text-left"
                  />
                </SelectTrigger>
                <SelectContent>
                  {groupOptions.map((group) => (
                    <SelectItem key={group.key} value={group.key}>
                      <div className="flex items-center justify-between gap-3 w-full py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{group.name}</span>
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                            {normalizeNames(group.networkType)}
                          </span>
                        </div>
                        {group.accounts.length > 1 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {group.accounts.length} linked
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Account Selector */}
          {visibleAccounts.length > 0 && (
            <div className="space-y-2">
              <label
                htmlFor="sprout-social-account-select"
                className="text-sm font-semibold text-foreground"
              >
                Social Media Account
              </label>
              <Select value={selectedAccountId || ''} onValueChange={handleAccountChange}>
                <SelectTrigger
                  id="sprout-social-account-select"
                  className="w-full min-h-[2.75rem] items-start bg-background py-2.5 text-left hover:bg-accent/50 transition-colors *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:items-start *:data-[slot=select-value]:text-left *:data-[slot=select-value]:flex-col"
                >
                  <SelectValue
                    placeholder="Select an account"
                    className="whitespace-normal leading-tight text-left"
                  />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[90vw]">
                  {visibleAccounts.map((account) => {
                    const displayName = account.nativeName && account.nativeName !== account.name
                      ? account.nativeName
                      : account.name;
                    const secondaryName =
                      account.nativeName && account.nativeName !== account.name
                        ? account.name
                        : null;
                    const accountIdLabel = account.nativeId ? `ID: ${account.nativeId}` : null;
                    return (
                      <SelectItem key={account.id} value={account.id} className="py-2.5">
                        <div className="flex items-center gap-2 w-full min-w-0 text-xs sm:text-sm">
                          <span className="font-medium text-sm truncate">{displayName}</span>
                          <span className="hidden sm:inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                            {normalizeNames(account.networkType)}
                          </span>
                          {secondaryName && (
                            <span className="text-xs text-muted-foreground truncate">
                              ({secondaryName})
                            </span>
                          )}
                          {accountIdLabel && (
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              • {accountIdLabel}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div className="flex items-start justify-between rounded-md border border-dashed bg-muted/40 px-3 py-2">
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
                    id="sprout-default-account"
                    checked={isDefaultSelection}
                    onCheckedChange={toggleDefaultAccount}
                    disabled={!selectedAccountId}
                  />
                  <Label htmlFor="sprout-default-account" className="text-sm">
                    Make default
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Selected Account Info Display */}
          {selectedAccount && (
            <div className="pt-3 mt-3 border-t border-border/50">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {selectedAccount.nativeName && selectedAccount.nativeName !== selectedAccount.name
                        ? selectedAccount.nativeName
                        : selectedAccount.name}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
                      {normalizeNames(selectedAccount.networkType)}
                    </span>
                  </div>
                  {selectedAccount.nativeName && selectedAccount.nativeName !== selectedAccount.name && (
                    <p className="text-xs text-muted-foreground">{selectedAccount.name}</p>
                  )}
                  {selectedAccount.nativeId && (
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      • ID: {selectedAccount.nativeId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
