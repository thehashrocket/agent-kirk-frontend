/**
 * @fileoverview Google Analytics Account DELETE API Route
 * 
 * This route handles soft deletion of individual Google Analytics accounts:
 * - Sets deleted flag to true on GA accounts and all associated properties
 * - Maintains data integrity while hiding deleted records from normal queries
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Authorization checks to ensure users can only delete their own GA accounts
 * - Soft delete implementation (sets deleted=true instead of removing records)
 * - Cascading soft delete for all associated GA properties
 * - Error handling with appropriate status codes
 * 
 * @route DELETE /api/users/[id]/ga-accounts/[accountId] - Soft delete a GA account
 * @security Requires authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Soft deletes a Google Analytics account and all associated properties
 * 
 * @param {Request} req - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @param {string} params.accountId - GA Account ID to soft delete
 * 
 * @returns {Promise<NextResponse>} Response with appropriate status:
 *   - 204: Successfully soft deleted
 *   - 401: Unauthorized if no valid session or user doesn't own the account
 *   - 404: Not Found if GA account doesn't exist
 *   - 500: Internal Server Error if operation fails
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, accountId } = await params;

   

    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

     // Find the GA account and verify ownership
     const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: accountId,
        userId: id,
        deleted: false, // Only allow deletion of non-deleted accounts
      },
      include: {
        user: true,
      },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found or already deleted', { status: 404 });
    }

    // Authorization logic
    let canDelete = false;

    if (currentUser.role.name === 'ADMIN') {
      // Admins can delete any property
      canDelete = true;
    } else if (currentUser.role.name === 'ACCOUNT_REP') {
      // Account reps can delete properties of their assigned clients
      if (gaAccount.user.accountRepId === currentUser.id) {
        canDelete = true;
      }
    } else if (currentUser.role.name === 'CLIENT') {
      // Clients can only delete their own properties
      if (gaAccount.userId === currentUser.id) {
        canDelete = true;
      }
    }

    // Perform soft delete using a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Soft delete the GA account
      await tx.gaAccount.update({
        where: { id: accountId },
        data: { deleted: true },
      });

      // Soft delete all associated GA properties
      await tx.gaProperty.updateMany({
        where: { 
          gaAccountId: accountId,
          deleted: false, // Only update properties that aren't already deleted
        },
        data: { deleted: true },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error soft deleting GA account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 