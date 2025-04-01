/**
 * @file src/app/account-rep/clients/page.tsx
 * Client management page for account representatives.
 * Provides functionality to view, create, delete, and manage client accounts
 * including password resets and status monitoring.
 */

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Interface representing a user in the system.
 * Used for client management and display in the table.
 * Matches the exact shape of data returned by the useUsers hook.
 */
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
  accountRepId: string | null;
  gaAccounts: Array<{
    id: string;
    gaAccountId: string;
    gaAccountName: string;
    gaProperties: Array<{
      id: string;
      gaPropertyId: string;
      gaPropertyName: string;
    }>;
  }>;
}

/**
 * @component ClientsPage
 * @path src/app/account-rep/clients/page.tsx
 * Main component for managing client accounts.
 * Features:
 * - Display list of clients in a table
 * - Create new client accounts
 * - Reset client passwords
 * - Delete/deactivate client accounts
 * - Monitor client status (active/inactive)
 */
export default function ClientsPage() {
  const { users, roles, isLoading, isError, mutate } = useUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    image: '',
  });

  /**
   * Handles the creation of a new client account.
   * Validates role, creates user with client role, and updates the UI.
   * Shows success/error notifications using toast.
   */
  const handleCreateClient = async () => {
    try {
      const clientRole = roles?.find((role) => role.name === 'CLIENT');
      if (!clientRole) {
        throw new Error('Client role not found');
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUser,
          roleId: clientRole.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      toast.success('Client created successfully');
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', image: '' });
      mutate();
    } catch {
      toast.error('Failed to create client');
    }
  };

  /**
   * Handles the deletion (deactivation) of a client account.
   * Implements soft delete by marking the account as inactive.
   * @param {string} userId - The ID of the client to delete
   */
  const handleDeleteClient = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      toast.success('Client deleted successfully');
      mutate();
    } catch {
      toast.error('Failed to delete client');
    }
  };

  /**
   * Handles password reset for a client account.
   * Generates a random password and updates the client's credentials.
   * Displays the new password in a success notification.
   * @param {string} userId - The ID of the client for password reset
   */
  const handleResetPassword = async (userId: string) => {
    try {
      const newPassword = Math.random().toString(36).slice(-8);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      toast.success('Password reset successfully', {
        description: `New password: ${newPassword}`,
      });
    } catch {
      toast.error('Failed to reset password');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: Failed to load users. Please check your connection and permissions.</div>;
  }

  if (!users) {
    console.error('No users data returned from useUsers hook');
    return <div>Error: No user data available. Please check your login status.</div>;
  }

  if (!Array.isArray(users)) {
    console.error('Expected users to be an array but got:', users);
    return <div>Error loading users. Please try again later.</div>;
  }

  const clients = users.filter((user) => user.role.name === 'CLIENT');

  if (clients.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Client Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Client</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                <Button onClick={handleCreateClient}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p>No clients found. Create a new client to get started.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <Input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
              <Button onClick={handleCreateClient}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Avatar>
                <AvatarImage 
                  src={client.image ?? ''}
                  alt={`Profile picture of ${client.name || 'user'}`} 
                />
                  <AvatarFallback>
                    {client.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>
                {client.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => handleResetPassword(client.id)}
                >
                  Reset Password
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/account-rep/clients/${client.id}`}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 