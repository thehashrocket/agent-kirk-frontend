/**
 * @file src/components/admin/AccountManagementSection.tsx
 * Comprehensive component for managing different types of accounts
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { AccountSelector } from './AccountSelector';
import { AccountCard, DisassociateButton } from './AccountCard';

interface Account {
  id: string;
  [key: string]: any;
}

interface AccountManagementSectionProps<T extends Account> {
  title: string;
  addButtonText: string;
  userAccounts: T[];
  userId: string;
  fetchAvailableAccounts: () => Promise<T[]>;
  associateAccount: (userId: string, accountId: string) => Promise<void>;
  disassociateAccount: (userId: string, accountId: string) => Promise<void>;
  renderAccountContent: (account: T) => React.ReactNode;
  renderAvailableAccount: (account: T) => React.ReactNode;
  getAccountId: (account: T) => string;
  getAccountLabel: (account: T) => string;
  emptyStateMessage: string;
  successMessage: {
    associate: string;
    disassociate: string;
  };
  errorMessage: {
    fetch: string;
    associate: string;
    disassociate: string;
  };
  onAccountsUpdated?: () => Promise<void> | void;
}

export function AccountManagementSection<T extends Account>({
  title,
  addButtonText,
  userAccounts,
  userId,
  fetchAvailableAccounts,
  associateAccount,
  disassociateAccount,
  renderAccountContent,
  renderAvailableAccount,
  getAccountId,
  getAccountLabel,
  emptyStateMessage,
  successMessage,
  errorMessage,
  onAccountsUpdated,
}: AccountManagementSectionProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<T[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available accounts when dialog opens
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!isDialogOpen) return;

      setIsLoading(true);
      try {
        const accounts = await fetchAvailableAccounts();
        setAvailableAccounts(accounts);

        // Pre-select accounts that the user already has access to
        const existingAccountIds = userAccounts.map(account => getAccountId(account));
        setSelectedAccountIds(existingAccountIds);
      } catch (error) {
        toast.error(errorMessage.fetch);
        console.error('Error fetching available accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [isDialogOpen, userAccounts, fetchAvailableAccounts, getAccountId, errorMessage.fetch]);

  const handleAssociateAccounts = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Please select at least one account');
      return;
    }

    try {
      // Get the current account IDs
      const currentAccountIds = userAccounts.map(account => getAccountId(account));

      // Find accounts to add (selected but not currently associated)
      const accountsToAdd = selectedAccountIds.filter(id => !currentAccountIds.includes(id));

      // Find accounts to remove (currently associated but not selected)
      const accountsToRemove = currentAccountIds.filter(id => !selectedAccountIds.includes(id));

      // Handle removals first
      await Promise.all(
        accountsToRemove.map(async (accountId) => {
          await disassociateAccount(userId, accountId);
        })
      );

      // Then handle additions
      await Promise.all(
        accountsToAdd.map(async (accountId) => {
          await associateAccount(userId, accountId);
        })
      );

      toast.success(successMessage.associate);
      setIsDialogOpen(false);
      setSelectedAccountIds([]);
      if (onAccountsUpdated) {
        await onAccountsUpdated();
      }
    } catch (error) {
      console.error('Error updating accounts:', error);
      toast.error(error instanceof Error ? error.message : errorMessage.associate);
    }
  };

  const handleDisassociate = async (accountId: string) => {
    try {
      await disassociateAccount(userId, accountId);
      toast.success(successMessage.disassociate);
      if (onAccountsUpdated) {
        await onAccountsUpdated();
      }
    } catch (error) {
      console.error('Error disassociating account:', error);
      toast.error(error instanceof Error ? error.message : errorMessage.disassociate);
    }
  };

  const sortedUserAccounts = useMemo(
    () =>
      [...userAccounts].sort((a, b) =>
        getAccountLabel(a).localeCompare(getAccountLabel(b), undefined, { sensitivity: 'base' })
      ),
    [userAccounts, getAccountLabel]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <AccountSelector
          title={`Add ${title}`}
          triggerText={addButtonText}
          accounts={availableAccounts}
          selectedAccountIds={selectedAccountIds}
          onSelectionChange={setSelectedAccountIds}
          onConfirm={handleAssociateAccounts}
          isLoading={isLoading}
          renderAccount={renderAvailableAccount}
          getAccountLabel={getAccountLabel}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedUserAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyStateMessage}
            </div>
          ) : (
            sortedUserAccounts.map((account) => (
              <AccountCard
                key={getAccountId(account)}
                actions={
                  <DisassociateButton
                    onDisassociate={() => handleDisassociate(getAccountId(account))}
                  />
                }
              >
                {renderAccountContent(account)}
              </AccountCard>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
