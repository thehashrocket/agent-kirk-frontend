/**
 * @file src/app/client/profile/page.tsx
 * Client profile management page that allows users to view and update their profile information.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Profile information display
 * - Password change functionality
 * - Form validation with error handling
 * - Toast notifications for user feedback
 * - Responsive layout using Tailwind CSS
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';

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
  const { users, isLoading } = useUsers();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentUser = users?.[0];

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

      const response = await fetch(`/api/users/${currentUser?.id}`, {
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

  if (isLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="max-w-md space-y-6">
        {/* Profile Information Section */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Profile Information</h2>
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{currentUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
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
          </div>
        </div>
      </div>
    </div>
  );
} 