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
import { useSession } from 'next-auth/react';

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
  userId?: string; // The user who owns this account
}

// New interface for client data
interface Client {
  id: string;
  name: string | null;
  email: string | null;
  gaAccounts: GaAccount[];
}

interface NewConversationButtonProps {
  onCreateConversation: (data: {
    title: string;
    gaAccountId?: string;
    gaPropertyId?: string;
    clientId?: string; // New: client ID for account reps
  }) => Promise<void>;
  isLoading?: boolean;
  gaAccounts: GaAccount[];
  clients?: Client[]; // New: clients list for account reps
}

export function NewConversationButton({
  onCreateConversation,
  isLoading = false,
  gaAccounts,
  clients = [], // Default to empty array
}: NewConversationButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(undefined);

  const isAccountRep = session?.user?.role === 'ACCOUNT_REP';
  
  // Get available GA accounts based on selection
  const availableAccounts = isAccountRep && selectedClientId 
    ? clients.find(client => client.id === selectedClientId)?.gaAccounts || []
    : gaAccounts;
    
  const selectedAccount = availableAccounts.find(account => account.id === selectedAccountId);

  // Reset dependent selections when parent selection changes
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedAccountId(undefined);
    setSelectedPropertyId(undefined);
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    setSelectedPropertyId(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateConversation({
      title,
      gaAccountId: selectedAccountId,
      gaPropertyId: selectedPropertyId,
      clientId: isAccountRep ? selectedClientId : undefined,
    });
    setTitle('');
    setSelectedClientId(undefined);
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
          
          {/* Client selection dropdown (only for account reps) */}
          {isAccountRep && clients.length > 0 && (
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name || client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* GA Account selection (conditionally shown) */}
          {(!isAccountRep || (isAccountRep && selectedClientId)) && (
            <Select value={selectedAccountId} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Google Analytics Account (optional)" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.gaAccountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* GA Property selection */}
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
              disabled={Boolean(
                isLoading || 
                !title || 
                (selectedAccountId && !selectedPropertyId) ||
                (isAccountRep && !selectedClientId)
              )}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 