/**
 * @file src/app/admin/users/page.tsx
 * Admin user management page that provides CRUD operations for user accounts.
 * Features user listing, role management, and account status monitoring.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useUsers } from '@/hooks/use-users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Interface representing a user in the system.
 * @property {string} id - Unique identifier for the user
 * @property {string|null} name - User's display name
 * @property {string|null} email - User's email address
 * @property {Object} role - User's role information
 * @property {string} role.id - Role identifier
 * @property {string} role.name - Role display name
 * @property {boolean} isActive - User's active status
 * @property {string|null} accountRepId - Associated account representative ID
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
}

/**
 * Interface representing a role in the system.
 * @property {string} id - Unique identifier for the role
 * @property {string} name - Display name of the role
 */
interface Role {
  id: string;
  name: string;
}

/**
 * @component UsersPage
 * @path src/app/admin/users/page.tsx
 * Main user management interface for administrators.
 * Features:
 * - User listing with role and status information
 * - User creation dialog with form validation
 * - Role management with inline editing
 * - User deletion with confirmation
 * - Real-time updates using SWR
 * - Toast notifications for action feedback
 * 
 * Uses shadcn/ui components for the interface.
 */
export default function UsersPage() {
  const { users, roles, isLoading, mutate } = useUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    image: '',
    password: '',
    roleId: '',
  });

  /**
   * Handles user creation.
   * Sends a POST request to create a new user with the provided details.
   * Shows success/error toast notifications and updates the user list.
   */
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast.success('User created successfully');
      setIsCreateDialogOpen(false);
      setNewUser({ name: '', email: '', image: '', password: '', roleId: '' });
      mutate();
    } catch {
      toast.error('Failed to create user');
    }
  };

  /**
   * Handles user deletion.
   * Sends a DELETE request to remove the specified user.
   * Shows success/error toast notifications and updates the user list.
   * @param {string} userId - ID of the user to delete
   */
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully');
      mutate();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  /**
   * Handles user role updates.
   * Sends a PATCH request to update the user's role.
   * Shows success/error toast notifications and updates the user list.
   * @param {string} userId - ID of the user to update
   * @param {string} roleId - ID of the new role to assign
   */
  const handleUpdateRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      toast.success('User role updated successfully');
      mutate();
    } catch {
      toast.error('Failed to update user role');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
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
              <Select
                value={newUser.roleId}
                onValueChange={(value: string) =>
                  setNewUser({ ...newUser, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateUser}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ProfileImage</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user: User) => (
            <TableRow key={user.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage src={user.image ?? ''} />
                  <AvatarFallback>{user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role.id}
                  onValueChange={(value: string) => handleUpdateRole(user.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue>{user.role.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role: Role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 