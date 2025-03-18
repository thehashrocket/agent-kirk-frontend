'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';

export default function ProfilePage() {
  const { users, isLoading } = useUsers();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentUser = users?.[0];

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