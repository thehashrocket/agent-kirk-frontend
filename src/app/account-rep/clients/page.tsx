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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

export default function ClientsPage() {
  const { users, roles, isLoading, mutate } = useUsers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
  });

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
      setNewUser({ name: '', email: '', password: '' });
      mutate();
    } catch {
      toast.error('Failed to create client');
    }
  };

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

  const clients = users?.filter((user) => user.role.name === 'CLIENT') ?? [];

  return (
    <div className="container mx-auto py-10">
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client: User) => (
            <TableRow key={client.id}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 