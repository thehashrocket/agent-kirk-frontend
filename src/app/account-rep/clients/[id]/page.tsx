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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
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
  uspsClients: {
    uspsClient: {
      id: string;
      clientName: string;
      createdAt: string;
      updatedAt: string;
      uspsCampaigns: {
        id: string;
        campaignName: string;
      }[];
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

interface UspsClient {
  id: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for the transformed user data that our component uses
interface TransformedUser extends Omit<User, 'userToGaAccounts' | 'sproutSocialAccounts' | 'emailClients' | 'uspsClients'> {
  gaAccounts: GaAccount[];
  sproutSocialAccounts: SproutSocialAccount[];
  emailClients: EmailClient[];
  uspsClients: UspsClient[];
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
          })) || [],
          uspsClients: data.uspsClients?.map(({ uspsClient }) => ({
            id: uspsClient.id,
            clientName: uspsClient.clientName,
            createdAt: uspsClient.createdAt,
            updatedAt: uspsClient.updatedAt,
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

  const fetchAvailableEmailClientsApi = async (): Promise<EmailClient[]> => {
    const response = await fetch('/api/admin/available-email-clients');
    if (!response.ok) {
      throw new Error('Failed to fetch available Email Clients');
    }
    return response.json();
  };

  const fetchAvailableSproutSocialAccountsApi = async (): Promise<SproutSocialAccount[]> => {
    const response = await fetch('/api/admin/available-sprout-social-accounts');
    if (!response.ok) {
      throw new Error('Failed to fetch available Social Media accounts');
    }
    return response.json();
  };

  const fetchAvailableUspsClientsApi = async (): Promise<UspsClient[]> => {
    const response = await fetch('/api/admin/available-usps-clients');
    if (!response.ok) {
      throw new Error('Failed to fetch available USPS Clients');
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

  const associateUspsClient = async (userId: string, clientId: string): Promise<void> => {
    console.log('Associating USPS Client:', userId, clientId);
    console.log('Request body:', { uspsClientId: clientId });
    console.log('Request URL:', `/api/users/${userId}/associate-usps-client`);
    const response = await fetch(`/api/users/${userId}/associate-usps-client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uspsClientId: clientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to associate USPS Client');
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

  const disassociateUspsClient = async (userId: string, clientId: string): Promise<void> => {
    const response = await fetch(
      `/api/users/${userId}/associate-usps-client?uspsClientId=${clientId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disassociate USPS Client');
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
    <div className="container mx-auto px-4 py-8 pb-16">
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
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  <AvatarImage src={client.image ?? ''} />
                  <AvatarFallback>{client.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight">{client.name ?? 'Unnamed client'}</h2>
                    <p className="text-sm text-muted-foreground break-all">{client.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={client.isActive ? 'default' : 'outline'}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant={client.company ? 'secondary' : 'outline'}>
                      {client.company?.name ?? 'No company assigned'}
                    </Badge>
                  </div>
                </div>
              </div>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Client ID</dt>
                  <dd className="text-sm font-medium break-all">{client.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
                  <dd className="text-sm font-medium">{formatDate(client.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</dt>
                  <dd className="text-sm font-medium">{formatDate(client.updatedAt)}</dd>
                </div>
                {client.company?.createdAt && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Company since</dt>
                    <dd className="text-sm font-medium">{formatDate(client.company.createdAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </CardContent>
        </Card>

        {client.company && (
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{client.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(client.company.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-medium">{formatDate(client.company.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company ID</p>
                <p className="font-mono text-sm break-all">{client.company.id}</p>
              </div>
            </CardContent>
          </Card>
        )}

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
          getAccountLabel={(account: SproutSocialAccount) => account.name || account.nativeName || ''}
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
          getAccountLabel={(emailClient: EmailClient) => emailClient.clientName}
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

        {/* USPS Clients - Using shared component */}
        <AccountManagementSection
          title="USPS Clients"
          addButtonText="Add USPS Client"
          userAccounts={client.uspsClients}
          userId={params.id as string}
          fetchAvailableAccounts={fetchAvailableUspsClientsApi}
          associateAccount={associateUspsClient}
          disassociateAccount={disassociateUspsClient}
          renderAccountContent={(uspsClient: UspsClient) => (
            <>
              <h3 className="font-semibold">{uspsClient.clientName}</h3>
              <p className="text-sm text-gray-500">Created: {new Date(uspsClient.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Last Updated: {new Date(uspsClient.updatedAt).toLocaleDateString()}</p>
            </>
          )}
          renderAvailableAccount={(uspsClient: UspsClient) => (
            <div>
              <p className="font-medium">{uspsClient.clientName}</p>
              <p className="text-sm text-gray-500">Created: {new Date(uspsClient.createdAt).toLocaleDateString()}</p>
            </div>
          )}
          getAccountLabel={(uspsClient: UspsClient) => uspsClient.clientName}
          getAccountId={(uspsClient: UspsClient) => uspsClient.id}
          emptyStateMessage="No USPS Clients associated with this client."
          successMessage={{
            associate: 'USPS Clients updated successfully',
            disassociate: 'USPS Client disassociated successfully'
          }}
          errorMessage={{
            fetch: 'Failed to fetch available USPS Clients',
            associate: 'Failed to update USPS Clients',
            disassociate: 'Failed to disassociate USPS Client'
          }}
        />


      </div>
    </div>
  );
}
