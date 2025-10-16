/**
 * @file src/components/admin/AccountSelector.tsx
 * Reusable component for selecting multiple accounts in a dialog
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Account {
  id: string;
  [key: string]: any;
}

interface AccountSelectorProps<T extends Account> {
  title: string;
  triggerText: string;
  accounts: T[];
  selectedAccountIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  renderAccount: (account: T) => React.ReactNode;
  getAccountLabel: (account: T) => string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSelector<T extends Account>({
  title,
  triggerText,
  accounts,
  selectedAccountIds,
  onSelectionChange,
  onConfirm,
  isLoading,
  renderAccount,
  getAccountLabel,
  isOpen,
  onOpenChange,
}: AccountSelectorProps<T>) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedAccountIds);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setInternalSelectedIds(selectedAccountIds);
  }, [selectedAccountIds]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...accounts]
      .sort((a, b) =>
        getAccountLabel(a).localeCompare(getAccountLabel(b), undefined, { sensitivity: 'base' })
      )
      .filter((account) => {
        if (!normalizedSearch) return true;
        return getAccountLabel(account).toLowerCase().includes(normalizedSearch);
      });
  }, [accounts, getAccountLabel, searchTerm]);

  const handleAccountToggle = (accountId: string) => {
    const newSelection = internalSelectedIds.includes(accountId)
      ? internalSelectedIds.filter(id => id !== accountId)
      : [...internalSelectedIds, accountId];
    
    setInternalSelectedIds(newSelection);
    onSelectionChange(newSelection);
  };

  const handleConfirm = async () => {
    await onConfirm();
    setInternalSelectedIds([]);
  };

  const handleCancel = () => {
    setInternalSelectedIds(selectedAccountIds);
    onSelectionChange(selectedAccountIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search accounts"
              />
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredAccounts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No accounts match your search.
                  </div>
                ) : (
                  filteredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        internalSelectedIds.includes(account.id)
                          ? 'bg-primary-50 border-primary-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAccountToggle(account.id)}
                    >
                      <input
                        type="checkbox"
                        checked={internalSelectedIds.includes(account.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      {renderAccount(account)}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Add Selected Accounts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
