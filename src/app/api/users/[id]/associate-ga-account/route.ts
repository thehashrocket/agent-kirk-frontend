/**
 * @file src/app/api/users/[id]/associate-ga-account/route.ts
 * API endpoint for associating and unassociating users with Google Analytics accounts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for GA account association
 */
const associateGaAccountSchema = z.object({
  gaAccountId: z.string().min(1, 'GA Account ID is required'),
});

type AssociateGaAccountInput = z.infer<typeof associateGaAccountSchema>;

/**
 * POST /api/users/[id]/associate-ga-account
 * 
 * Associates a user with a Google Analytics account.
 * 
 * Request Body:
 * {
 *   "gaAccountId": "string" // The ID of the GA account to associate
 * }
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 201: Successfully associated GA account
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or GA account not found
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found in database' }, { status: 404 });
    }

    // Check admin/account rep role
    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = associateGaAccountSchema.parse(body);

    // Get the target user ID from params
    const targetUserId = (await params).id;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found', userId: targetUserId },
        { status: 404 }
      );
    }

    // Verify the GA account exists and is not deleted
    const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: validatedData.gaAccountId,
        deleted: false,
      },
    });

    if (!gaAccount) {
      return NextResponse.json({ error: 'GA Account not found' }, { status: 404 });
    }

    // Check if the association already exists
    const existingAssociation = await prisma.userToGaAccount.findFirst({
      where: {
        userId: targetUserId,
        gaAccountId: validatedData.gaAccountId,
      },
    });

    if (existingAssociation) {
      return NextResponse.json({ error: 'GA Account already associated with user' }, { status: 400 });
    }

    // Create the association
    const userToGaAccount = await prisma.userToGaAccount.create({
      data: {
        userId: targetUserId,
        gaAccountId: validatedData.gaAccountId,
      },
      include: {
        gaAccount: {
          include: {
            gaProperties: {
              where: {
                deleted: false,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(userToGaAccount.gaAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/associate-ga-account
 * 
 * Unassociates a user from a Google Analytics account.
 * 
 * Query Parameters:
 * - gaAccountId: The ID of the GA account to unassociate
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 204: Successfully unassociated GA account
 * - 400: Invalid request parameters
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or GA account not found
 * - 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin/account rep role
    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
    }

    // Get GA account ID from query parameters
    const { searchParams } = new URL(request.url);
    const gaAccountId = searchParams.get('gaAccountId');

    if (!gaAccountId) {
      return NextResponse.json({ error: 'GA Account ID is required' }, { status: 400 });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: (await params).id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Find and delete the association
    const association = await prisma.userToGaAccount.findFirst({
      where: {
        userId: (await params).id,
        gaAccountId: gaAccountId,
      },
    });

    if (!association) {
      return NextResponse.json({ error: 'GA Account not associated with user' }, { status: 404 });
    }

    // Delete the association
    await prisma.userToGaAccount.delete({
      where: {
        id: association.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unassociating GA account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 