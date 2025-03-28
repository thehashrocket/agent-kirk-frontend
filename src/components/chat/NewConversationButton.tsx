/**
 * @file src/components/chat/NewConversationButton.tsx
 * Button component for creating new conversations with a title input dialog.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface NewConversationButtonProps {
  onCreateConversation: (data: {
    title: string;
    gaAccountId?: string;
    gaPropertyId?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  gaAccounts: GaAccount[];
}

export function NewConversationButton({
  onCreateConversation,
  isLoading = false,
  gaAccounts,
}: NewConversationButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(undefined);

  const selectedAccount = gaAccounts.find(account => account.id === selectedAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateConversation({
      title,
      gaAccountId: selectedAccountId,
      gaPropertyId: selectedPropertyId,
    });
    setTitle('');
    setSelectedAccountId(undefined);
    setSelectedPropertyId(undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">New Conversation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Conversation title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Google Analytics Account (optional)" />
            </SelectTrigger>
            <SelectContent>
              {gaAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.gaAccountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAccount && (
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
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
          <DialogFooter>
            <Button
              type="submit"
              disabled={Boolean(isLoading || !title || (selectedAccountId && !selectedPropertyId))}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 