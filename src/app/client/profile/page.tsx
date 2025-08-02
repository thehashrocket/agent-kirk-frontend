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

import { useState } from 'react';
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
} from '@/components/ui/dialog';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import BreadCrumbs from '@/components/layout/BreadCrumbs';

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
  const { data: profile, mutate } = useSWR<UserProfile>('/api/users/me', fetcher);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadCrumbs breadcrumbs={[{ label: "Home", href: "/" }, { label: "Profile", href: "/client/profile" }]} />
      <h1 className="text-2xl font-bold mb-2 text-primary uppercase">My Profile</h1>

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
            {/* Trigger a test email using the mailgun route */}
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
                      to: 'Jason Shultzz <jason@test.com>',
                      subject: 'Test Email from Profile Page',
                      text: 'This is a test email sent from the profile page using Mailgun.',
                    }),
                  });
                  if (!response.ok) {
                    throw new Error('Failed to send test email');
                  }
                  toast.success('Test email sent successfully');
                } catch (error) {
                  toast.error('Failed to send test email');
                }
              }}
            >Send Test Email</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}