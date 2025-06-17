/**
 * @file src/app/admin/users/[id]/page.tsx
 * User details page for administrators.
 * Shows user information and allows management of Google Analytics accounts.
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  image?: string | null;
  userToGaAccounts: {
    gaAccount: {
      id: string;
      gaAccountId: string;
      gaAccountName: string;
      gaProperties: GaProperty[];
    };
  }[];
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

// Interface for the transformed user data that our component uses
interface TransformedUser extends Omit<User, 'userToGaAccounts'> {
  gaAccounts: GaAccount[];
}

export default function UserDetailsPage() {
  const params = useParams();
  const [user, setUser] = useState<TransformedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGaAccountDialogOpen, setIsGaAccountDialogOpen] = useState(false);
  const [isGaPropertyDialogOpen, setIsGaPropertyDialogOpen] = useState(false);
  const [selectedGaAccount, setSelectedGaAccount] = useState<GaAccount | null>(null);
  const [availableGaAccounts, setAvailableGaAccounts] = useState<GaAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [newGaProperty, setNewGaProperty] = useState({
    gaPropertyId: '',
    gaPropertyName: '',
  });

  // Fetch user data when the component mounts or the id changes
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/users/${params.id}`);
            if (!response.ok) {
              throw new Error('Failed to fetch client data');
            }
            const data: User = await response.json();
            // Transform the data to match our component's structure
            const transformedData: TransformedUser = {
              ...data,
              gaAccounts: data.userToGaAccounts?.map(({ gaAccount }) => ({
                id: gaAccount.id,
                gaAccountId: gaAccount.gaAccountId,
                gaAccountName: gaAccount.gaAccountName,
                gaProperties: gaAccount.gaProperties
              })) || []
            };
            setUser(transformedData);
          } catch (error) {
            toast.error('Failed to fetch client data');
            console.error('Error fetching client:', error);
          } finally {
            setIsLoading(false);
          }
        };

    fetchUser();
  }, [params]);

  // Fetch available GA accounts when dialog opens
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      if (!isGaAccountDialogOpen) return;
      
      setIsLoadingAccounts(true);
      try {
        const response = await fetch('/api/admin/available-ga-accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch available GA accounts');
        }
        const data = await response.json();
        setAvailableGaAccounts(data);
        
        // Pre-select accounts that the user already has access to
        if (user) {
          const existingAccountIds = user.gaAccounts.map(account => account.id);
          setSelectedAccounts(existingAccountIds);
        }
      } catch (error) {
        toast.error('Failed to fetch available GA accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAvailableAccounts();
  }, [isGaAccountDialogOpen, user]);

  const handleAddGaAccounts = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one GA account');
      return;
    }

    try {
      // Get the current account IDs
      const currentAccountIds = user?.gaAccounts.map(account => account.id) || [];
      
      // Find accounts to add (selected but not currently associated)
      const accountsToAdd = selectedAccounts.filter(id => !currentAccountIds.includes(id));
      
      // Find accounts to remove (currently associated but not selected)
      const accountsToRemove = currentAccountIds.filter(id => !selectedAccounts.includes(id));

      console.log('User ID from params:', params.id);
      console.log('Accounts to add:', accountsToAdd);
      console.log('Accounts to remove:', accountsToRemove);

      // Handle removals first
      await Promise.all(
        accountsToRemove.map(async (accountId) => {
          const response = await fetch(
            `/api/users/${params.id}/associate-ga-account?gaAccountId=${accountId}`,
            { method: 'DELETE' }
          );
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to disassociate GA account');
          }
        })
      );

      // Then handle additions
      await Promise.all(
        accountsToAdd.map(async (accountId) => {
          console.log(`Adding account ${accountId} to user ${params.id}`);
          const response = await fetch(`/api/users/${params.id}/associate-ga-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gaAccountId: accountId }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Error response:', error);
            throw new Error(error.error || 'Failed to associate GA account');
          }
        })
      );

      toast.success('Google Analytics accounts updated successfully');
      setIsGaAccountDialogOpen(false);
      setSelectedAccounts([]);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating GA accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Google Analytics accounts');
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

  const handleDeleteGaProperty = async (accountId: string, propertyId: string) => {
    try {
      const response = await fetch(`/api/users/${params.id}/ga-accounts/${accountId}/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete GA property');
      }

      toast.success('Google Analytics property deleted successfully');
      // Refresh user data
      window.location.reload();
    } catch {
      toast.error('Failed to delete Google Analytics property');
    }
  };

  const handleDisassociateGaAccount = async (accountId: string) => {
    try {
      const response = await fetch(
        `/api/users/${params.id}/associate-ga-account?gaAccountId=${accountId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disassociate GA account');
      }

      toast.success('Google Analytics account disassociated successfully');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error disassociating GA account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disassociate Google Analytics account');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Details: {user.name}</h1>
      </div>

      <div className="grid gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role.name}</p>
                <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <Avatar className="w-40 h-40">
                <AvatarImage className="w-40 h-40" src={user.image ?? ''} />
                <AvatarFallback>{user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>

        {/* Google Analytics Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Google Analytics Accounts</CardTitle>
            {/* Add GA Account Dialog */}
            <Dialog open={isGaAccountDialogOpen} onOpenChange={setIsGaAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add GA Account</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Google Analytics Accounts</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isLoadingAccounts ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {availableGaAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAccounts.includes(account.id)
                              ? 'bg-primary-50 border-primary-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSelectedAccounts((prev) =>
                              prev.includes(account.id)
                                ? prev.filter((id) => id !== account.id)
                                : [...prev, account.id]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div>
                            <p className="font-medium">{account.gaAccountName}</p>
                            <p className="text-sm text-gray-500">ID: {account.gaAccountId}</p>
                            <p className="text-sm text-gray-500">
                              {account.gaProperties.length} properties
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsGaAccountDialogOpen(false);
                        setSelectedAccounts([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddGaAccounts}>
                      Add Selected Accounts
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.gaAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Google Analytics accounts associated with this user.
                </div>
              ) : (
                user.gaAccounts.map((account: GaAccount) => (
                  <Card key={account.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{account.gaAccountName}</h3>
                        <p className="text-sm text-gray-500">ID: {account.gaAccountId}</p>
                      </div>
                      <div className="flex flex-row items-center gap-2">
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
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDisassociateGaAccount(account.id)}
                        >
                          Disassociate Account
                        </Button>
                      </div>
                    </div>
                    {/* Properties List */}
                    <div className="pl-4 border-l-2 border-gray-100">
                      <h4 className="text-sm font-medium mb-2">Properties:</h4>
                      <div className="space-y-2">
                        {account.gaProperties.length === 0 ? (
                          <div className="text-sm text-gray-500 py-2">
                            No properties associated with this account.
                          </div>
                        ) : (
                          account.gaProperties.map((property: GaProperty) => (
                            <div key={property.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                              <div className="text-sm">
                                <p className="font-medium">{property.gaPropertyName}</p>
                                <p className="text-gray-500">ID: {property.gaPropertyId}</p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteGaProperty(account.id, property.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Delete
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
