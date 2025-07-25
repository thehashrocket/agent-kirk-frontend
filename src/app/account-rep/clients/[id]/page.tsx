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
import { normalizeNames } from '@/lib/utils/normalize-names';
import { AccountManagementSection } from '@/components/admin/AccountManagementSection';
import { GoogleAnalyticsManagementSection } from '@/components/admin/GoogleAnalyticsManagementSection';

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

  // API functions for account management
  const fetchAvailableSproutSocialAccountsApi = async (): Promise<SproutSocialAccount[]> => {
    const response = await fetch('/api/admin/available-sprout-social-accounts');
    if (!response.ok) {
      throw new Error('Failed to fetch available Social Media accounts');
    }
    return response.json();
  };

  const fetchAvailableEmailClientsApi = async (): Promise<EmailClient[]> => {
    const response = await fetch('/api/admin/available-email-clients');
    if (!response.ok) {
      throw new Error('Failed to fetch available Email Clients');
    }
    return response.json();
  };

  const associateSproutSocialAccount = async (userId: string, accountId: string): Promise<void> => {
    const response = await fetch(`/api/users/${userId}/associate-sprout-social-account`, {
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
  };

  const disassociateSproutSocialAccount = async (userId: string, accountId: string): Promise<void> => {
    const response = await fetch(
      `/api/users/${userId}/associate-sprout-social-account?sproutSocialAccountId=${accountId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disassociate Social Media account');
    }
  };

  const associateEmailClient = async (userId: string, clientId: string): Promise<void> => {
    const response = await fetch(`/api/users/${userId}/associate-email-client`, {
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
  };

  const disassociateEmailClient = async (userId: string, clientId: string): Promise<void> => {
    const response = await fetch(
      `/api/users/${userId}/associate-email-client?emailClientId=${clientId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disassociate Email Client');
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

        {/* Google Analytics Accounts - Using shared component */}
        <GoogleAnalyticsManagementSection
          userGaAccounts={client.gaAccounts}
          userId={params.id as string}
        />

        {/* Social Media Accounts - Using shared component */}
        <AccountManagementSection
          title="Social Media Accounts"
          addButtonText="Add Social Media Account"
          userAccounts={client.sproutSocialAccounts}
          userId={params.id as string}
          fetchAvailableAccounts={fetchAvailableSproutSocialAccountsApi}
          associateAccount={associateSproutSocialAccount}
          disassociateAccount={disassociateSproutSocialAccount}
          renderAccountContent={(account: SproutSocialAccount) => (
            <>
              <h3 className="font-semibold">{account.name}</h3>
              <p className="text-sm text-gray-500">Platform: {normalizeNames(account.networkType)}</p>
              <p className="text-sm text-gray-500">Native Name: {account.nativeName}</p>
              <p className="text-sm text-gray-500">Profile ID: {account.customerProfileId}</p>
            </>
          )}
          renderAvailableAccount={(account: SproutSocialAccount) => (
            <div>
              <p className="font-medium">{account.name}</p>
              <p className="text-sm text-gray-500">Platform: {normalizeNames(account.networkType)}</p>
              <p className="text-sm text-gray-500">Native Name: {account.nativeName}</p>
              <p className="text-sm text-gray-500">Profile ID: {account.customerProfileId}</p>
            </div>
          )}
          getAccountId={(account: SproutSocialAccount) => account.id}
          emptyStateMessage="No Social Media accounts associated with this client."
          successMessage={{
            associate: 'Social Media accounts updated successfully',
            disassociate: 'Social Media account disassociated successfully'
          }}
          errorMessage={{
            fetch: 'Failed to fetch available Social Media accounts',
            associate: 'Failed to update Social Media accounts',
            disassociate: 'Failed to disassociate Social Media account'
          }}
        />

        {/* Email Clients - Using shared component */}
        <AccountManagementSection
          title="Email Clients"
          addButtonText="Add Email Client"
          userAccounts={client.emailClients}
          userId={params.id as string}
          fetchAvailableAccounts={fetchAvailableEmailClientsApi}
          associateAccount={associateEmailClient}
          disassociateAccount={disassociateEmailClient}
          renderAccountContent={(emailClient: EmailClient) => (
            <>
              <h3 className="font-semibold">{emailClient.clientName}</h3>
              <p className="text-sm text-gray-500">Created: {new Date(emailClient.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Last Updated: {new Date(emailClient.updatedAt).toLocaleDateString()}</p>
            </>
          )}
          renderAvailableAccount={(emailClient: EmailClient) => (
            <div>
              <p className="font-medium">{emailClient.clientName}</p>
              <p className="text-sm text-gray-500">Created: {new Date(emailClient.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          getAccountId={(emailClient: EmailClient) => emailClient.id}
          emptyStateMessage="No Email Clients associated with this client."
          successMessage={{
            associate: 'Email Clients updated successfully',
            disassociate: 'Email Client disassociated successfully'
          }}
          errorMessage={{
            fetch: 'Failed to fetch available Email Clients',
            associate: 'Failed to update Email Clients',
            disassociate: 'Failed to disassociate Email Client'
          }}
        />
      </div>
    </div>
  );
} 