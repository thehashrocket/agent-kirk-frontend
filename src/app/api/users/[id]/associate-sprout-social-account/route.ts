/**
 * @file src/app/api/users/[id]/associate-sprout-social-account/route.ts
 * API endpoint for associating and disassociating users with Sprout Social accounts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for Sprout Social account association
 */
const associateSproutSocialAccountSchema = z.object({
  sproutSocialAccountId: z.string().min(1, 'Sprout Social Account ID is required'),
});

type AssociateSproutSocialAccountInput = z.infer<typeof associateSproutSocialAccountSchema>;

/**
 * POST /api/users/[id]/associate-sprout-social-account
 * 
 * Associates a user with a Sprout Social account.
 * 
 * Request Body:
 * {
 *   "sproutSocialAccountId": "string" // The ID of the Sprout Social account to associate
 * }
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 201: Successfully associated Sprout Social account
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or Sprout Social account not found
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
    const validatedData = associateSproutSocialAccountSchema.parse(body);

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

    // Verify the Sprout Social account exists
    const sproutSocialAccount = await prisma.sproutSocialAccount.findFirst({
      where: {
        id: validatedData.sproutSocialAccountId,
      },
    });

    if (!sproutSocialAccount) {
      return NextResponse.json({ error: 'Sprout Social Account not found' }, { status: 404 });
    }

    // Check if the association already exists
    const existingAssociation = await prisma.userToSproutSocialAccount.findFirst({
      where: {
        userId: targetUserId,
        sproutSocialAccountId: validatedData.sproutSocialAccountId,
      },
    });

    if (existingAssociation) {
      return NextResponse.json({ error: 'Sprout Social Account already associated with user' }, { status: 400 });
    }

    // Create the association
    const userToSproutSocialAccount = await prisma.userToSproutSocialAccount.create({
      data: {
        userId: targetUserId,
        sproutSocialAccountId: validatedData.sproutSocialAccountId,
      },
      include: {
        sproutSocialAccount: true,
      },
    });

    return NextResponse.json(userToSproutSocialAccount.sproutSocialAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error associating Sprout Social account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/associate-sprout-social-account
 * 
 * Unassociates a user from a Sprout Social account.
 * 
 * Query Parameters:
 * - sproutSocialAccountId: The ID of the Sprout Social account to unassociate
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 204: Successfully unassociated Sprout Social account
 * - 400: Invalid request parameters
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or Sprout Social account not found
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

    // Get Sprout Social account ID from query parameters
    const { searchParams } = new URL(request.url);
    const sproutSocialAccountId = searchParams.get('sproutSocialAccountId');

    if (!sproutSocialAccountId) {
      return NextResponse.json({ error: 'Sprout Social Account ID is required' }, { status: 400 });
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
    const association = await prisma.userToSproutSocialAccount.findFirst({
      where: {
        userId: (await params).id,
        sproutSocialAccountId: sproutSocialAccountId,
      },
    });

    if (!association) {
      return NextResponse.json({ error: 'Sprout Social Account not associated with user' }, { status: 404 });
    }

    // Delete the association
    await prisma.userToSproutSocialAccount.delete({
      where: {
        id: association.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unassociating Sprout Social account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 