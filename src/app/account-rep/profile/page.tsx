/**
 * @file src/app/account-rep/profile/page.tsx
 * Account representative profile management page that allows users to view and update their profile information.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Profile information display
 * - Password change functionality
 * - Google Analytics account management
 * - Form validation with error handling
 * - Toast notifications for user feedback
 * - Responsive layout using Tailwind CSS
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  userToGaAccounts: {
    gaAccount: {
      id: string;
      gaAccountId: string;
      gaAccountName: string;
      gaProperties: GaProperty[];
    };
  }[];
}

interface TransformedUser extends Omit<User, 'userToGaAccounts'> {
  gaAccounts: GaAccount[];
}

export default function AccountRepProfilePage() {
  const { data: session } = useSession();
  const { data: userData, mutate, error } = useSWR<User>(
    session?.user?.id ? `/api/users/${session.user.id}` : null,
    fetcher
  );

  // Transform the user data to match our component's structure
  const profile = useMemo<TransformedUser | null>(() => 
    userData ? {
      ...userData,
      gaAccounts: userData.userToGaAccounts?.map(({ gaAccount }) => ({
        id: gaAccount.id,
        gaAccountId: gaAccount.gaAccountId,
        gaAccountName: gaAccount.gaAccountName,
        gaProperties: gaAccount.gaProperties
      })) || []
    } : null,
    [userData]
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGaDialogOpen, setIsGaDialogOpen] = useState(false);
  const [isGaPropertyDialogOpen, setIsGaPropertyDialogOpen] = useState(false);
  const [selectedGaAccount, setSelectedGaAccount] = useState<GaAccount | null>(null);
  const [availableGaAccounts, setAvailableGaAccounts] = useState<GaAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [newGaProperty, setNewGaProperty] = useState({
    gaPropertyId: '',
    gaPropertyName: '',
  });

  // Fetch available GA accounts when dialog opens
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      if (!isGaDialogOpen) return;
      
      setIsLoadingAccounts(true);
      try {
        const response = await fetch('/api/admin/available-ga-accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch available GA accounts');
        }
        const data = await response.json();
        setAvailableGaAccounts(data);
        
        // Pre-select accounts that the user already has access to
        if (profile) {
          const existingAccountIds = profile.gaAccounts.map(account => account.id);
          setSelectedAccounts(existingAccountIds);
        }
      } catch (error) {
        toast.error('Failed to fetch available GA accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAvailableAccounts();
  }, [isGaDialogOpen, profile]);

  const handleChangePassword = async () => {
    try {
      if (!session?.user?.id) {
        toast.error('Not authenticated');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    }
  };

  const handleAddGaAccounts = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one GA account');
      return;
    }

    try {
      // Get the current account IDs
      const currentAccountIds = profile?.gaAccounts.map(account => account.id) || [];
      
      // Find accounts to add (selected but not currently associated)
      const accountsToAdd = selectedAccounts.filter(id => !currentAccountIds.includes(id));
      
      // Find accounts to remove (currently associated but not selected)
      const accountsToRemove = currentAccountIds.filter(id => !selectedAccounts.includes(id));

      // Handle removals first
      await Promise.all(
        accountsToRemove.map(async (accountId) => {
          const response = await fetch(
            `/api/users/${session?.user?.id}/associate-ga-account?gaAccountId=${accountId}`,
            { method: 'DELETE' }
          );
          if (!response.ok) {
            throw new Error('Failed to disassociate GA account');
          }
        })
      );

      // Then handle additions
      await Promise.all(
        accountsToAdd.map(async (accountId) => {
          const response = await fetch(`/api/users/${session?.user?.id}/associate-ga-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gaAccountId: accountId }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to associate GA account');
          }
        })
      );

      toast.success('Google Analytics accounts updated successfully');
      setIsGaDialogOpen(false);
      setSelectedAccounts([]);
      await mutate();
    } catch (error) {
      console.error('Error updating GA accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Google Analytics accounts');
    }
  };

  const handleAddGaProperty = async () => {
    if (!selectedGaAccount) return;

    try {
      const response = await fetch(`/api/users/${session?.user?.id}/ga-accounts/${selectedGaAccount.id}/properties`, {
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
      await mutate();
    } catch {
      toast.error('Failed to add Google Analytics property');
    }
  };

  const handleDeleteGaProperty = async (accountId: string, propertyId: string) => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/ga-accounts/${accountId}/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete GA property');
      }

      toast.success('Google Analytics property deleted successfully');
      await mutate();
    } catch {
      toast.error('Failed to delete Google Analytics property');
    }
  };

  if (!session || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="max-w-3xl space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{profile.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button onClick={handleChangePassword}>Change Password</Button>
          </CardContent>
        </Card>

        {/* Google Analytics Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Google Analytics Accounts</CardTitle>
              <CardDescription>Manage your connected Google Analytics accounts</CardDescription>
            </div>
            <Dialog open={isGaDialogOpen} onOpenChange={setIsGaDialogOpen}>
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
                        setIsGaDialogOpen(false);
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
              {profile.gaAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Google Analytics accounts associated with your profile.
                </div>
              ) : (
                profile.gaAccounts.map((account) => (
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
                          account.gaProperties.map((property) => (
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