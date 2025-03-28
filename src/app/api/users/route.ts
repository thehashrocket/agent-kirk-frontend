/**
 * @fileoverview User Management API Route Handler
 * 
 * This module implements a RESTful API for user management in the application.
 * It provides endpoints for CRUD operations on users with role-based access control (RBAC).
 * 
 * Key features:
 * - Role-based access control (Admin, Account Rep, Client)
 * - Secure password hashing with bcryptjs
 * - Input validation using Zod schemas
 * - Soft delete functionality
 * - Hierarchical data access patterns
 * 
 * Endpoints:
 * - GET    /api/users - List users based on role permissions
 * - POST   /api/users - Create new user (Admin/Account Rep only)
 * - PATCH  /api/users/:id - Update user with role-based restrictions
 * - DELETE /api/users/:id - Soft delete user (Admin/Account Rep only)
 * 
 * @package @kirk/api
 * @module users
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';

/**
 * Type representing the structure of a user in the system
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} password - Hashed password
 * @property {string} roleId - Associated role ID
 * @property {string} [accountRepId] - Optional account representative ID
 * @property {boolean} isActive - User's active status
 */

/**
 * Zod schema for validating user creation requests.
 * Ensures new users have required fields and proper data types.
 * 
 * @constant {z.ZodObject}
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
 * 
 * @constant {z.ZodObject}
 */
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET handler for retrieving users based on role permissions.
 * 
 * Access patterns:
 * - Admins: Can see all users
 * - Account Reps: Can see their assigned clients
 * - Clients: Can only see themselves
 * 
 * @async
 * @function GET
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing users or error
 * @throws {Error} When database operations fail
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
 * 
 * Access patterns:
 * - Admin: Can create any type of user
 * - Account Rep: Can only create client users assigned to them
 * - Client: Cannot create users
 * 
 * @async
 * @function POST
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing created user or error
 * @throws {z.ZodError} When request body validation fails
 * @throws {Error} When database operations fail
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
 * 
 * Access patterns:
 * - Admin: Can update any user
 * - Account Rep: Can update their assigned clients (except role)
 * - Client: Can only update their own password
 * 
 * @async
 * @function PATCH
 * @param {NextRequest} request - The incoming request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - ID of the user to update
 * @returns {Promise<NextResponse>} JSON response containing updated user or error
 * @throws {z.ZodError} When request body validation fails
 * @throws {Error} When database operations fail
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
 * 
 * Access patterns:
 * - Admin: Can delete any user
 * - Account Rep: Can only delete their assigned clients
 * - Client: Cannot delete users
 * 
 * Note: This implements soft delete by setting isActive to false
 * rather than removing the record from the database.
 * 
 * @async
 * @function DELETE
 * @param {NextRequest} request - The incoming request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - ID of the user to delete
 * @returns {Promise<NextResponse>} JSON response containing deactivated user or error
 * @throws {Error} When database operations fail
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