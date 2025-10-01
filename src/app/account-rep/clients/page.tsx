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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleAlert, Trash2 } from 'lucide-react';
import { CompanySearchSelect } from '@/components/users/company-search-select';

/**
 * Interface representing a user in the system.
 * Used for client management and display in the table.
 * Matches the exact shape of data returned by the useUsers hook.
 */
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
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
  const [showInactive, setShowInactive] = useState(false);
  const { users, roles, isLoading, isError, mutate } = useUsers({ showInactive });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const initialNewUser = {
    name: '',
    email: '',
    password: '',
    image: '',
    companyId: undefined as string | undefined,
  };
  const [newUser, setNewUser] = useState(initialNewUser);

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

      const payload: Record<string, unknown> = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        roleId: clientRole.id,
      };

      if (newUser.image) {
        payload.image = newUser.image;
      }

      if (newUser.companyId) {
        payload.companyId = newUser.companyId;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      toast.success('Client created successfully');
      setIsCreateDialogOpen(false);
      setNewUser(initialNewUser);
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
  const handleResetPassword = async (userId: string, email: string) => {
    {/* Reset Password Button. When clicked, it sends a request to the mailgun api
      using the password_reset template using the variable link to send a password reset link */}
    try {
      const response = await fetch('/api/mailgun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          email_template: 'password reset',
          link: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?userId=${userId}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }

      toast.success('Password reset email sent successfully');
    } catch (error) {
      toast.error('Failed to send password reset email');
    }
  };
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    // Mark as inactive if active, active if inactive
    // Send a PATCH request to the API
    // Show a toast notification
    // Update the user list

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          isActive: isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle user status');
      }

      toast.success('User status toggled successfully');
      mutate(
        (currentData: User[] | undefined) =>
          currentData?.map(user => user.id === userId ? { ...user, isActive: !user.isActive } : user)
      );
    } catch {
      toast.error('Failed to toggle user status');
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: Failed to load users. Please check your connection and permissions.</div>;
  }

  if (!users) {
    // console.error('No users data returned from useUsers hook');
    return <div>Error: No user data available. Please check your login status.</div>;
  }

  if (!Array.isArray(users)) {
    // console.error('Expected users to be an array but got:', users);
    return <div>Error loading users. Please try again later.</div>;
  }

  const clients = users.filter((user) => user.role.name === 'CLIENT');

  if (clients.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Client Management</h1>
          <div className="flex items-center space-x-2">
            <label className="flex items-center gap-2">
              <Switch
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              Show Inactive Users
            </label>
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
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <CompanySearchSelect
                      value={newUser.companyId}
                      onChange={(companyId) =>
                        setNewUser({ ...newUser, companyId })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional: Link the client to an existing company or create one.
                    </p>
                  </div>
                  <Button onClick={handleCreateClient}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p>No clients found. Create a new client to get started.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <div className="flex items-center space-x-2">
          <label className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            Show Inactive Users
          </label>
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
                <div className="space-y-2">
                  <Label>Company</Label>
                  <CompanySearchSelect
                    value={newUser.companyId}
                    onChange={(companyId) =>
                      setNewUser({ ...newUser, companyId })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Link the client to an existing company or create one.
                  </p>
                </div>
                <Button onClick={handleCreateClient}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <CircleAlert className='mr-2' /> Confirm Deletion
              </div>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            {userToDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteClient(userToDelete.id);
                  setIsDeleteDialogOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <TableRow
              key={client.id}
              className={client.isActive ? '' : 'bg-gray-100'}
            >
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
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `/account-rep/clients/${client.id}`}
                  >
                    View Details
                  </Button>
                  {/* If User is active, show Mark as Inactive, if User is inactive, show Mark as Active */}
                  {client.isActive ? (
                    <Button
                      variant="secondary"
                      onClick={() => toggleUserStatus(client.id, false)}
                    >
                      Mark as Inactive
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => toggleUserStatus(client.id, true)}
                    >
                      Mark as Active
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => handleResetPassword(client.id, client.email ?? '')}
                  >
                    Reset Password
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      setUserToDelete(client);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>

                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
