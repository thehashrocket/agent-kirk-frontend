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

import { useState } from 'react';
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

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  gaAccounts: GaAccount[];
}

export default function AccountRepProfilePage() {
  const { data: session } = useSession();
  const { data: profile, mutate, error } = useSWR<UserProfile>(
    session?.user?.id ? `/api/users/${session.user.id}` : null,
    fetcher
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGaDialogOpen, setIsGaDialogOpen] = useState(false);
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

  const handleAddGaAccount = async () => {
    try {
      if (!session?.user?.id) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`/api/users/${session.user.id}/ga-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGaAccount),
      });

      if (!response.ok) {
        throw new Error('Failed to add Google Analytics account');
      }

      toast.success('Google Analytics account added successfully');
      setIsGaDialogOpen(false);
      setNewGaAccount({ gaAccountId: '', gaAccountName: '' });
      await mutate();
    } catch {
      toast.error('Failed to add Google Analytics account');
    }
  };

  const handleRemoveGaAccount = async (accountId: string) => {
    try {
      if (!session?.user?.id) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`/api/users/${session.user.id}/ga-accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove Google Analytics account');
      }

      toast.success('Google Analytics account removed successfully');
      await mutate();
    } catch {
      toast.error('Failed to remove Google Analytics account');
    }
  };

  const handleAddGaProperty = async () => {
    try {
      if (!session?.user?.id || !selectedGaAccount) {
        toast.error('Not authenticated or no account selected');
        return;
      }

      const response = await fetch(
        `/api/users/${session.user.id}/ga-accounts/${selectedGaAccount.id}/properties`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newGaProperty),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add Google Analytics property');
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
          <CardHeader>
            <CardTitle>Google Analytics Accounts</CardTitle>
            <CardDescription>Manage your connected Google Analytics accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => setIsGaDialogOpen(true)}
                className="mb-4"
              >
                Add GA Account
              </Button>

              <Dialog open={isGaDialogOpen} onOpenChange={setIsGaDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Google Analytics Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Account ID</label>
                      <Input
                        value={newGaAccount.gaAccountId}
                        onChange={(e) =>
                          setNewGaAccount({
                            ...newGaAccount,
                            gaAccountId: e.target.value,
                          })
                        }
                        placeholder="Enter GA Account ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Account Name</label>
                      <Input
                        value={newGaAccount.gaAccountName}
                        onChange={(e) =>
                          setNewGaAccount({
                            ...newGaAccount,
                            gaAccountName: e.target.value,
                          })
                        }
                        placeholder="Enter GA Account Name"
                      />
                    </div>
                    <Button onClick={handleAddGaAccount}>Add Account</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isGaPropertyDialogOpen} onOpenChange={setIsGaPropertyDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Google Analytics Property</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Property ID</label>
                      <Input
                        value={newGaProperty.gaPropertyId}
                        onChange={(e) =>
                          setNewGaProperty({
                            ...newGaProperty,
                            gaPropertyId: e.target.value,
                          })
                        }
                        placeholder="Enter GA Property ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Property Name</label>
                      <Input
                        value={newGaProperty.gaPropertyName}
                        onChange={(e) =>
                          setNewGaProperty({
                            ...newGaProperty,
                            gaPropertyName: e.target.value,
                          })
                        }
                        placeholder="Enter GA Property Name"
                      />
                    </div>
                    <Button onClick={handleAddGaProperty}>Add Property</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {profile.gaAccounts?.length > 0 ? (
                <div className="space-y-4">
                  {profile.gaAccounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{account.gaAccountName}</h3>
                            <p className="text-sm text-gray-500">ID: {account.gaAccountId}</p>
                            <div className="mt-4 flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGaAccount(account);
                                  setIsGaPropertyDialogOpen(true);
                                }}
                              >
                                Add Property
                              </Button>
                            </div>
                            {account.gaProperties?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium">Properties:</p>
                                <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                  {account.gaProperties.map((property) => (
                                    <li key={property.id}>
                                      {property.gaPropertyName} ({property.gaPropertyId})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveGaAccount(account.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No Google Analytics accounts connected</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 