/**
 * @file src/app/client/profile/page.tsx
 * Client profile management page that allows users to view and update their profile information.
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

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import BreadCrumbs from '@/components/layout/BreadCrumbs';
import { normalizeNames } from '@/lib/utils/normalize-names';

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
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
  };
  company: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  userToGaAccounts: {
    gaAccount: GaAccount;
  }[];
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

/**
 * @component ProfilePage
 * @path src/app/client/profile/page.tsx
 * Client Component that renders the profile management interface.
 *
 * Features:
 * - Display of user's name and email
 * - Password change form with validation
 * - Real-time form validation
 * - Toast notifications for action feedback
 * - Loading state handling
 *
 * Form Validation:
 * - Passwords must match
 * - Password must be at least 6 characters
 * - All fields are required
 *
 * Error Handling:
 * - Displays validation errors with toast notifications
 * - Handles API errors gracefully
 * - Shows loading state during data fetch
 *
 * Layout:
 * - Responsive container with max width
 * - Consistent spacing using Tailwind's spacing scale
 * - Clear section separation for different profile aspects
 */
export default function ProfilePage() {
  const { data: profile } = useSWR<UserProfile>('/api/users/me', fetcher);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const gaAccounts = useMemo<GaAccount[]>(() => {
    if (!profile?.userToGaAccounts) return [];
    return profile.userToGaAccounts
      .map(({ gaAccount }) => gaAccount)
      .filter((account): account is GaAccount => Boolean(account));
  }, [profile?.userToGaAccounts]);

  /**
   * Handles password change request.
   * Validates passwords and sends update request to the API.
   * Shows success/error feedback via toast notifications.
   *
   * Validation:
   * - Checks if passwords match
   * - Ensures minimum password length
   *
   * @returns {Promise<void>}
   * @throws Will show error toast if API request fails
   */
  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      const response = await fetch(`/api/users/${profile?.id}`, {
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex animate-pulse flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-muted" />
              <div className="space-y-3">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-4 w-48 rounded bg-muted" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadCrumbs breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile", href: "/client/profile" }]} />
      <h1 className="mb-6 text-3xl font-bold">My Profile</h1>

      <div className="mx-auto grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Primary details about your account and membership.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  <AvatarImage src={profile.image ?? ''} />
                  <AvatarFallback>{profile.name?.split(' ').map((part) => part[0]).join('').toUpperCase() || 'ME'}</AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight">{profile.name ?? 'Unnamed account'}</h2>
                    <p className="text-sm text-muted-foreground break-all">{profile.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={profile.isActive ? 'default' : 'outline'}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary">{normalizeNames(profile.role?.name ?? 'CLIENT')}</Badge>
                    <Badge variant={profile.company ? 'outline' : 'secondary'}>
                      {profile.company?.name ?? 'No company assigned'}
                    </Badge>
                  </div>
                </div>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">User ID</dt>
                  <dd className="text-sm font-medium break-all">{profile.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
                  <dd className="text-sm font-medium">{formatDate(profile.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</dt>
                  <dd className="text-sm font-medium">{formatDate(profile.updatedAt)}</dd>
                </div>
                {profile.company?.createdAt && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Company since</dt>
                    <dd className="text-sm font-medium">{formatDate(profile.company.createdAt)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </CardContent>
        </Card>

        {profile.company && (
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
              <CardDescription>Your current organization in Kirk.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profile.company.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(profile.company.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-medium">{formatDate(profile.company.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company ID</p>
                <p className="font-mono text-sm break-all">{profile.company.id}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Analytics Connections</CardTitle>
            <CardDescription>Your linked Google Analytics accounts and properties.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gaAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Google Analytics accounts are linked to your profile yet.</p>
            ) : (
              <div className="grid gap-4">
                {gaAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border border-dashed p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Account</p>
                        <p className="font-medium">{account.gaAccountName}</p>
                        <p className="text-xs text-muted-foreground">ID: {account.gaAccountId}</p>
                      </div>
                      <Badge variant="outline">{account.gaProperties.length} property{account.gaProperties.length === 1 ? '' : 'ies'}</Badge>
                    </div>
                    {account.gaProperties.length > 0 && (
                      <ul className="mt-3 space-y-2 text-sm">
                        {account.gaProperties.map((property) => (
                          <li key={property.id} className="flex flex-col rounded-md bg-muted/40 p-2">
                            <span className="font-medium">{property.gaPropertyName}</span>
                            <span className="text-xs text-muted-foreground">{property.gaPropertyId}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password. Make sure it is unique and secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleChangePassword}>Change Password</Button>
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
                        to: profile.email ?? '',
                        email_template: 'welcome email',
                        link: `${process.env.NEXT_PUBLIC_APP_URL}/client/profile`,
                      }),
                    });
                    if (!response.ok) {
                      throw new Error('Failed to send test email');
                    }
                    toast.success('Test email sent successfully');
                  } catch {
                    toast.error('Failed to send test email');
                  }
                }}
              >
                Send Test Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
