/**
 * @file src/app/admin/users/[id]/page.tsx
 * User details page for administrators.
 * Shows user information and allows management of Google Analytics accounts, Email Clients, and Social Media accounts.
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
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AccountManagementSection } from '@/components/admin/AccountManagementSection';
import { GoogleAnalyticsManagementSection } from '@/components/admin/GoogleAnalyticsManagementSection';
import { normalizeNames } from '@/lib/utils/normalize-names';

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

export default function UserDetailsPage() {
    const params = useParams();
    const [user, setUser] = useState<TransformedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGaAccountDialogOpen, setIsGaAccountDialogOpen] = useState(false);
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
                    throw new Error('Failed to fetch user data');
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
                    })) || [],
                    uspsClients: data.uspsClients?.map(({ uspsClient }) => ({
                        id: uspsClient.id,
                        clientName: uspsClient.clientName,
                        createdAt: uspsClient.createdAt,
                        updatedAt: uspsClient.updatedAt
                    })) || []
                };
                setUser(transformedData);
            } catch (error) {
                toast.error('Failed to fetch user data');
                console.error('Error fetching user:', error);
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

    // API functions for account management
    const fetchAvailableSproutSocialAccounts = async (): Promise<SproutSocialAccount[]> => {
        const response = await fetch('/api/admin/available-sprout-social-accounts');
        if (!response.ok) {
            throw new Error('Failed to fetch available Social Media accounts');
        }
        return response.json();
    };

    const fetchAvailableEmailClients = async (): Promise<EmailClient[]> => {
        const response = await fetch('/api/admin/available-email-clients');
        if (!response.ok) {
            throw new Error('Failed to fetch available Email Clients');
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
                        <div className="flex flex-row items-center justify-end mt-4">
                            {/* Reset Password Button. When clicked, it sends a request to the mailgun api
                            using the password_reset template using the variable link to send a password reset link */}
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    try {
                                        const response = await fetch('/api/mailgun', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                to: user.email,
                                                email_template: 'password reset',
                                                link: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?userId=${user.id}`
                                            }),
                                        });

                                        if (!response.ok) {
                                            throw new Error('Failed to send password reset email');
                                        }

                                        toast.success('Password reset email sent successfully');
                                    } catch (error) {
                                        toast.error('Failed to send password reset email');
                                    }
                                }}
                            >
                                Reset Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Google Analytics Accounts - Using shared component */}
                <GoogleAnalyticsManagementSection
                    userGaAccounts={user.gaAccounts}
                    userId={params.id as string}
                />

                {/* Social Media Accounts - Using shared component */}
                <AccountManagementSection
                    title="Social Media Accounts"
                    addButtonText="Add Social Media Account"
                    userAccounts={user.sproutSocialAccounts}
                    userId={params.id as string}
                    fetchAvailableAccounts={fetchAvailableSproutSocialAccounts}
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
                    emptyStateMessage="No Social Media accounts associated with this user."
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
                    userAccounts={user.emailClients}
                    userId={params.id as string}
                    fetchAvailableAccounts={fetchAvailableEmailClients}
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
                    emptyStateMessage="No Email Clients associated with this user."
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
                    userAccounts={user.uspsClients}
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
