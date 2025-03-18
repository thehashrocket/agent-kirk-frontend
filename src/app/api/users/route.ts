import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string(),
  accountRepId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users - Get all users (Admin) or assigned clients (Account Rep)
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
        },
      });
      return NextResponse.json(clients);
    }

    // Clients can only see themselves
    if (currentUser.role.name === 'CLIENT') {
      return NextResponse.json([currentUser]);
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
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

// PATCH /api/users/[id] - Update a user
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

// DELETE /api/users/[id] - Soft delete a user
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