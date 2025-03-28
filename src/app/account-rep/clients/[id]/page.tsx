/**
 * @file src/app/account-rep/clients/[id]/page.tsx
 * Client details page for account representatives.
 * Shows client information and allows management of Google Analytics accounts.
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  gaAccounts: GaAccount[];
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const { users } = useUsers();
  const [isGaAccountDialogOpen, setIsGaAccountDialogOpen] = useState(false);
  const [isGaPropertyDialogOpen, setIsGaPropertyDialogOpen] = useState(false);
  const [selectedGaAccount, setSelectedGaAccount] = useState<GaAccount | null>(null);
  const [newGaAccount, setNewGaAccount] = useState({
    gaAccountId: '',
    gaAccountName: '',
  });
  const [newGaProperty, setNewGaProperty] = useState({
    gaPropertyId: '',
    gaPropertyName: '',
  });

  const client = users?.find((user) => user.id === params.id);
  const gaAccounts = client?.gaAccounts || [];

  const handleAddGaAccount = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}/ga-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGaAccount),
      });

      if (!response.ok) {
        throw new Error('Failed to add GA account');
      }

      toast.success('Google Analytics account added successfully');
      setIsGaAccountDialogOpen(false);
      setNewGaAccount({ gaAccountId: '', gaAccountName: '' });
      // Refresh user data
      window.location.reload();
    } catch {
      toast.error('Failed to add Google Analytics account');
    }
  };

  const handleAddGaProperty = async () => {
    if (!selectedGaAccount) return;

    try {
      const response = await fetch(`/api/users/${params.id}/ga-accounts/${selectedGaAccount.id}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGaProperty),
      });

      if (!response.ok) {
        throw new Error('Failed to add GA property');
      }

      toast.success('Google Analytics property added successfully');
      setIsGaPropertyDialogOpen(false);
      setNewGaProperty({ gaPropertyId: '', gaPropertyName: '' });
      setSelectedGaAccount(null);
      // Refresh user data
      window.location.reload();
    } catch {
      toast.error('Failed to add Google Analytics property');
    }
  };

  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Client Details: {client.name}</h1>
      </div>

      <div className="grid gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {client.name}</p>
              <p><strong>Email:</strong> {client.email}</p>
              <p><strong>Status:</strong> {client.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Google Analytics Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Google Analytics Accounts</CardTitle>
            <Dialog open={isGaAccountDialogOpen} onOpenChange={setIsGaAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add GA Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Google Analytics Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Account ID"
                    value={newGaAccount.gaAccountId}
                    onChange={(e) =>
                      setNewGaAccount({ ...newGaAccount, gaAccountId: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Account Name"
                    value={newGaAccount.gaAccountName}
                    onChange={(e) =>
                      setNewGaAccount({ ...newGaAccount, gaAccountName: e.target.value })
                    }
                  />
                  <Button onClick={handleAddGaAccount}>Add Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gaAccounts.map((account: GaAccount) => (
                <Card key={account.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{account.gaAccountName}</h3>
                      <p className="text-sm text-gray-500">ID: {account.gaAccountId}</p>
                    </div>
                    <Dialog open={isGaPropertyDialogOpen && selectedGaAccount?.id === account.id} 
                           onOpenChange={(open) => {
                             setIsGaPropertyDialogOpen(open);
                             if (!open) setSelectedGaAccount(null);
                           }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedGaAccount(account)}
                        >
                          Add Property
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Google Analytics Property</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Property ID"
                            value={newGaProperty.gaPropertyId}
                            onChange={(e) =>
                              setNewGaProperty({ ...newGaProperty, gaPropertyId: e.target.value })
                            }
                          />
                          <Input
                            placeholder="Property Name"
                            value={newGaProperty.gaPropertyName}
                            onChange={(e) =>
                              setNewGaProperty({ ...newGaProperty, gaPropertyName: e.target.value })
                            }
                          />
                          <Button onClick={handleAddGaProperty}>Add Property</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {/* Properties List */}
                  <div className="pl-4 border-l-2 border-gray-100">
                    <h4 className="text-sm font-medium mb-2">Properties:</h4>
                    <div className="space-y-2">
                      {account.gaProperties.map((property: GaProperty) => (
                        <div key={property.id} className="text-sm">
                          <p className="font-medium">{property.gaPropertyName}</p>
                          <p className="text-gray-500">ID: {property.gaPropertyId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 