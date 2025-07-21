/**
 * @file src/app/account-rep/clients/[id]/page.tsx
 * Client details page for account representatives.
 * Shows client information and allows management of Google Analytics accounts.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
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
import { normalizeSocialNetworkName } from '@/lib/utils/normalize-social-network-names';

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
  sproutSocialAccounts: {
    sproutSocialAccount: {
      id: string;
      customerProfileId: number;
      networkType: string;
      name: string;
      nativeName: string;
      link: string;
      nativeId: string;
      groups: number[];
    };
  }[];
  emailClients: {
    emailClient: {
      id: string;
      clientName: string;
      createdAt: string;
      updatedAt: string;
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

interface SproutSocialAccount {
  id: string;
  customerProfileId: number;
  networkType: string;
  name: string;
  nativeName: string;
  link: string;
  nativeId: string;
  groups: number[];
}

interface EmailClient {
  id: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for the transformed user data that our component uses
interface TransformedUser extends Omit<User, 'userToGaAccounts' | 'sproutSocialAccounts' | 'emailClients'> {
  gaAccounts: GaAccount[];
  sproutSocialAccounts: SproutSocialAccount[];
  emailClients: EmailClient[];
}

export default function ClientDetailsPage() {
  const params = useParams();
  const [client, setClient] = useState<TransformedUser | null>(null);
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

  // Social Media Account states
  const [isSproutSocialAccountDialogOpen, setIsSproutSocialAccountDialogOpen] = useState(false);
  const [availableSproutSocialAccounts, setAvailableSproutSocialAccounts] = useState<SproutSocialAccount[]>([]);
  const [selectedSproutSocialAccounts, setSelectedSproutSocialAccounts] = useState<string[]>([]);
  const [isLoadingSproutSocialAccounts, setIsLoadingSproutSocialAccounts] = useState(false);

  // Email Client states
  const [isEmailClientDialogOpen, setIsEmailClientDialogOpen] = useState(false);
  const [availableEmailClients, setAvailableEmailClients] = useState<EmailClient[]>([]);
  const [selectedEmailClients, setSelectedEmailClients] = useState<string[]>([]);
  const [isLoadingEmailClients, setIsLoadingEmailClients] = useState(false);

  // Fetch client data when the component mounts or the id changes
  useEffect(() => {
    const fetchClient = async () => {
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
          })) || [],
          sproutSocialAccounts: data.sproutSocialAccounts?.map(({ sproutSocialAccount }) => ({
            id: sproutSocialAccount.id,
            customerProfileId: sproutSocialAccount.customerProfileId,
            networkType: sproutSocialAccount.networkType,
            name: sproutSocialAccount.name,
            nativeName: sproutSocialAccount.nativeName,
            link: sproutSocialAccount.link,
            nativeId: sproutSocialAccount.nativeId,
            groups: sproutSocialAccount.groups
          })) || [],
          emailClients: data.emailClients?.map(({ emailClient }) => ({
            id: emailClient.id,
            clientName: emailClient.clientName,
            createdAt: emailClient.createdAt,
            updatedAt: emailClient.updatedAt
          })) || []
        };
        setClient(transformedData);
      } catch (error) {
        toast.error('Failed to fetch client data');
        console.error('Error fetching client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [params.id]);

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

        // Pre-select accounts that the client already has access to
        if (client) {
          const existingAccountIds = client.gaAccounts.map(account => account.id);
          setSelectedAccounts(existingAccountIds);
        }
      } catch (error) {
        toast.error('Failed to fetch available GA accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAvailableAccounts();
  }, [isGaAccountDialogOpen, client]);

  // Fetch available Social Media accounts when dialog opens
  useEffect(() => {
    const fetchAvailableSproutSocialAccounts = async () => {
      if (!isSproutSocialAccountDialogOpen) return;

      setIsLoadingSproutSocialAccounts(true);
      try {
        const response = await fetch('/api/admin/available-sprout-social-accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch available Social Media accounts');
        }
        const data = await response.json();
        setAvailableSproutSocialAccounts(data);

        // Pre-select accounts that the client already has access to
        if (client) {
          const existingAccountIds = client.sproutSocialAccounts.map(account => account.id);
          setSelectedSproutSocialAccounts(existingAccountIds);
        }
      } catch (error) {
        toast.error('Failed to fetch available Social Media accounts');
      } finally {
        setIsLoadingSproutSocialAccounts(false);
      }
    };

    fetchAvailableSproutSocialAccounts();
  }, [isSproutSocialAccountDialogOpen, client]);

  // Fetch available Email Clients when dialog opens
  useEffect(() => {
    const fetchAvailableEmailClients = async () => {
      if (!isEmailClientDialogOpen) return;

      setIsLoadingEmailClients(true);
      try {
        const response = await fetch('/api/admin/available-email-clients');
        if (!response.ok) {
          throw new Error('Failed to fetch available Email Clients');
        }
        const data = await response.json();
        setAvailableEmailClients(data);

        // Pre-select clients that the user already has access to
        if (client) {
          const existingClientIds = client.emailClients.map(emailClient => emailClient.id);
          setSelectedEmailClients(existingClientIds);
        }
      } catch (error) {
        toast.error('Failed to fetch available Email Clients');
      } finally {
        setIsLoadingEmailClients(false);
      }
    };

    fetchAvailableEmailClients();
  }, [isEmailClientDialogOpen, client]);

  const handleAddGaAccounts = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one GA account');
      return;
    }

    try {
      // Get the current account IDs
      const currentAccountIds = client?.gaAccounts.map(account => account.id) || [];

      // Find accounts to add (selected but not currently associated)
      const accountsToAdd = selectedAccounts.filter(id => !currentAccountIds.includes(id));

      // Find accounts to remove (currently associated but not selected)
      const accountsToRemove = currentAccountIds.filter(id => !selectedAccounts.includes(id));

      // Handle removals first
      await Promise.all(
        accountsToRemove.map(async (accountId) => {
          const response = await fetch(
            `/api/users/${params.id}/associate-ga-account?gaAccountId=${accountId}`,
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
          const response = await fetch(`/api/users/${params.id}/associate-ga-account`, {
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

  const handleAddSproutSocialAccounts = async () => {
    if (selectedSproutSocialAccounts.length === 0) {
      toast.error('Please select at least one Social Media account');
      return;
    }

    try {
      // Get the current account IDs
      const currentAccountIds = client?.sproutSocialAccounts.map(account => account.id) || [];

      // Find accounts to add (selected but not currently associated)
      const accountsToAdd = selectedSproutSocialAccounts.filter(id => !currentAccountIds.includes(id));

      // Find accounts to remove (currently associated but not selected)
      const accountsToRemove = currentAccountIds.filter(id => !selectedSproutSocialAccounts.includes(id));

      // Handle removals first
      await Promise.all(
        accountsToRemove.map(async (accountId) => {
          const response = await fetch(
            `/api/users/${params.id}/associate-sprout-social-account?sproutSocialAccountId=${accountId}`,
            { method: 'DELETE' }
          );
          if (!response.ok) {
            throw new Error('Failed to disassociate Social Media account');
          }
        })
      );

      // Then handle additions
      await Promise.all(
        accountsToAdd.map(async (accountId) => {
          const response = await fetch(`/api/users/${params.id}/associate-sprout-social-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sproutSocialAccountId: accountId }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to associate Social Media account');
          }
        })
      );

      toast.success('Social Media accounts updated successfully');
      setIsSproutSocialAccountDialogOpen(false);
      setSelectedSproutSocialAccounts([]);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating Social Media accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Social Media accounts');
    }
  };

  const handleDisassociateSproutSocialAccount = async (accountId: string) => {
    try {
      const response = await fetch(
        `/api/users/${params.id}/associate-sprout-social-account?sproutSocialAccountId=${accountId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disassociate Social Media account');
      }

      toast.success('Social Media account disassociated successfully');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error disassociating Social Media account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disassociate Social Media account');
    }
  };

  const handleAddEmailClients = async () => {
    if (selectedEmailClients.length === 0) {
      toast.error('Please select at least one Email Client');
      return;
    }

    try {
      // Get the current client IDs
      const currentClientIds = client?.emailClients.map(emailClient => emailClient.id) || [];

      // Find clients to add (selected but not currently associated)
      const clientsToAdd = selectedEmailClients.filter(id => !currentClientIds.includes(id));

      // Find clients to remove (currently associated but not selected)
      const clientsToRemove = currentClientIds.filter(id => !selectedEmailClients.includes(id));

      // Handle removals first
      await Promise.all(
        clientsToRemove.map(async (clientId) => {
          const response = await fetch(
            `/api/users/${params.id}/associate-email-client?emailClientId=${clientId}`,
            { method: 'DELETE' }
          );
          if (!response.ok) {
            throw new Error('Failed to disassociate Email Client');
          }
        })
      );

      // Then handle additions
      await Promise.all(
        clientsToAdd.map(async (clientId) => {
          const response = await fetch(`/api/users/${params.id}/associate-email-client`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emailClientId: clientId }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to associate Email Client');
          }
        })
      );

      toast.success('Email Clients updated successfully');
      setIsEmailClientDialogOpen(false);
      setSelectedEmailClients([]);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating Email Clients:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update Email Clients');
    }
  };

  const handleDisassociateEmailClient = async (clientId: string) => {
    try {
      const response = await fetch(
        `/api/users/${params.id}/associate-email-client?emailClientId=${clientId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disassociate Email Client');
      }

      toast.success('Email Client disassociated successfully');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error disassociating Email Client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disassociate Email Client');
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

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          Client not found
        </div>
      </div>
    );
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
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <p><strong>Name:</strong> {client.name}</p>
                <p><strong>Email:</strong> {client.email}</p>
                <p><strong>Status:</strong> {client.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <Avatar className="w-40 h-40">
                <AvatarImage className="w-40 h-40" src={client.image ?? ''} />
                <AvatarFallback>{client.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}</AvatarFallback>
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
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAccounts.includes(account.id)
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
                            onChange={() => { }}
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
              {client.gaAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Google Analytics accounts associated with this client.
                </div>
              ) : (
                client.gaAccounts.map((account: GaAccount) => (
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

        {/* Social Media Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Social Media Accounts</CardTitle>
            {/* Add Social Media Account Dialog */}
            <Dialog open={isSproutSocialAccountDialogOpen} onOpenChange={setIsSproutSocialAccountDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Social Media Account</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Social Media Accounts</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isLoadingSproutSocialAccounts ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {availableSproutSocialAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedSproutSocialAccounts.includes(account.id)
                            ? 'bg-primary-50 border-primary-200'
                            : 'hover:bg-gray-50'
                            }`}
                          onClick={() => {
                            setSelectedSproutSocialAccounts((prev) =>
                              prev.includes(account.id)
                                ? prev.filter((id) => id !== account.id)
                                : [...prev, account.id]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSproutSocialAccounts.includes(account.id)}
                            onChange={() => { }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-gray-500">Platform: {normalizeSocialNetworkName(account.networkType)}</p>
                            <p className="text-sm text-gray-500">Native Name: {account.nativeName}</p>
                            <p className="text-sm text-gray-500">Profile ID: {account.customerProfileId}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSproutSocialAccountDialogOpen(false);
                        setSelectedSproutSocialAccounts([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddSproutSocialAccounts}>
                      Add Selected Accounts
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.sproutSocialAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Social Media accounts associated with this client.
                </div>
              ) : (
                client.sproutSocialAccounts.map((account: SproutSocialAccount) => (
                  <Card key={account.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-gray-500">Platform: {normalizeSocialNetworkName(account.networkType)}</p>
                        <p className="text-sm text-gray-500">Native Name: {account.nativeName}</p>
                        <p className="text-sm text-gray-500">Profile ID: {account.customerProfileId}</p>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleDisassociateSproutSocialAccount(account.id)}
                        >
                          Disassociate Account
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Email Clients</CardTitle>
            {/* Add Email Client Dialog */}
            <Dialog open={isEmailClientDialogOpen} onOpenChange={setIsEmailClientDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Email Client</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Email Clients</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isLoadingEmailClients ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {availableEmailClients.map((emailClient) => (
                        <div
                          key={emailClient.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedEmailClients.includes(emailClient.id)
                            ? 'bg-primary-50 border-primary-200'
                            : 'hover:bg-gray-50'
                            }`}
                          onClick={() => {
                            setSelectedEmailClients((prev) =>
                              prev.includes(emailClient.id)
                                ? prev.filter((id) => id !== emailClient.id)
                                : [...prev, emailClient.id]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmailClients.includes(emailClient.id)}
                            onChange={() => { }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div>
                            <p className="font-medium">{emailClient.clientName}</p>
                            <p className="text-sm text-gray-500">Created: {new Date(emailClient.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEmailClientDialogOpen(false);
                        setSelectedEmailClients([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddEmailClients}>
                      Add Selected Clients
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {client.emailClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No Email Clients associated with this client.
                </div>
              ) : (
                client.emailClients.map((emailClient: EmailClient) => (
                  <Card key={emailClient.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{emailClient.clientName}</h3>
                        <p className="text-sm text-gray-500">Created: {new Date(emailClient.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">Last Updated: {new Date(emailClient.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-row items-center gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleDisassociateEmailClient(emailClient.id)}
                        >
                          Disassociate Client
                        </Button>
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