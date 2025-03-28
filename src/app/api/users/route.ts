/**
 * @file src/app/api/users/route.ts
 * Users API route handler for managing user operations.
 * Provides endpoints for creating, reading, updating, and soft-deleting users
 * with role-based access control and permission management.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';

/**
 * Zod schema for validating user creation requests.
 * Ensures new users have required fields and proper data types.
 */
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string(),
  accountRepId: z.string().optional(),
});

/**
 * Zod schema for validating user update requests.
 * All fields are optional as updates can be partial.
 */
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET handler for retrieving users based on role permissions:
 * - Admins can see all users
 * - Account Reps can see their assigned clients
 * - Clients can only see themselves
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} Response containing users or error
 */
export async function GET(
  request: NextRequest
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Admin can see all users
    if (currentUser.role.name === 'ADMIN') {
      const users = await prisma.user.findMany({
        include: {
          role: true,
          gaAccounts: {
            include: {
              gaProperties: true,
            },
          },
        },
      });
      return NextResponse.json(users);
    }

    // Account Rep can only see their assigned clients
    if (currentUser.role.name === 'ACCOUNT_REP') {
      const clients = await prisma.user.findMany({
        where: {
          accountRepId: currentUser.id,
        },
        include: {
          role: true,
          gaAccounts: {
            include: {
              gaProperties: true,
            },
          },
        },
      });
      return NextResponse.json(clients);
    }

    // Clients can only see themselves
    if (currentUser.role.name === 'CLIENT') {
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
        include: {
          role: true,
          gaAccounts: {
            include: {
              gaProperties: true,
            },
          },
        },
      });
      return NextResponse.json(user ? [user] : []);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST handler for creating new users.
 * Only Admin and Account Rep roles can create users.
 * Account Reps can only create client users assigned to them.
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} Response containing created user or error
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const json = await request.json();
    const body = createUserSchema.parse(json);

    // Only Admin and Account Rep can create users
    if (!['ADMIN', 'ACCOUNT_REP'].includes(currentUser.role.name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Account Rep can only create clients assigned to them
    if (currentUser.role.name === 'ACCOUNT_REP') {
      const clientRole = await prisma.role.findFirst({
        where: { name: 'CLIENT' },
      });

      if (body.roleId !== clientRole?.id) {
        return NextResponse.json(
          { error: 'Account Reps can only create client users' },
          { status: 403 }
        );
      }

      body.accountRepId = currentUser.id;
    }

    const salt = await bcryptjs.genSalt(12);
    const hashedPassword = await bcryptjs.hash(body.password, salt);

    const user = await prisma.user.create({
      data: {
        ...body,
        password: hashedPassword,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH handler for updating users.
 * Role-based permissions:
 * - Clients can only update their own password
 * - Account Reps can update their assigned clients (except role)
 * - Admins can update any user
 * 
 * @param {NextRequest} request - The incoming request object
 * @param {Object} params - Route parameters containing user ID
 * @returns {Promise<NextResponse>} Response containing updated user or error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const json = await request.json();
    const body = updateUserSchema.parse(json);

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check permissions
    if (currentUser.role.name === 'CLIENT') {
      // Clients can only update their own password
      if (currentUser.id !== id || Object.keys(body).length > 1 || !body.password) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (currentUser.role.name === 'ACCOUNT_REP') {
      // Account Reps can only update their assigned clients
      if (targetUser.accountRepId !== currentUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Account Reps cannot change client's role
      if (body.roleId) {
        return NextResponse.json({ error: 'Cannot change user role' }, { status: 403 });
      }
    }

    // Hash password if it's being updated
    const updateData = { ...body };
    if (body.password) {
      const salt = await bcryptjs.genSalt(12);
      updateData.password = await bcryptjs.hash(body.password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE handler for soft-deleting users.
 * Only admins can delete users.
 * Implements soft delete by deactivating the user rather than removing from database.
 * 
 * @param {NextRequest} request - The incoming request object
 * @param {Object} params - Route parameters containing user ID
 * @returns {Promise<NextResponse>} Response indicating success or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Check permissions
    if (currentUser.role.name === 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (currentUser.role.name === 'ACCOUNT_REP') {
      // Account Reps can only delete their assigned clients
      if (targetUser.accountRepId !== currentUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Soft delete by setting isActive to false
    const deletedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        role: true,
      },
    });

    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 