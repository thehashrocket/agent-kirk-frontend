/**
 * @fileoverview Google Analytics Property DELETE API Route
 * 
 * This route handles soft deletion of individual Google Analytics properties:
 * - Sets deleted flag to true on specific GA properties
 * - Maintains data integrity while hiding deleted records from normal queries
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Authorization checks for account reps and property owners
 * - Soft delete implementation (sets deleted=true instead of removing records)
 * - Error handling with appropriate status codes
 * 
 * @route DELETE /api/users/[id]/ga-accounts/[accountId]/properties/[propertyId] - Soft delete a GA property
 * @security Requires authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Soft deletes a Google Analytics property
 * 
 * @param {Request} req - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @param {string} params.accountId - GA Account ID
 * @param {string} params.propertyId - GA Property ID to soft delete
 * 
 * @returns {Promise<NextResponse>} Response with appropriate status:
 *   - 204: Successfully soft deleted
 *   - 401: Unauthorized if no valid session
 *   - 403: Forbidden if user doesn't have permission
 *   - 404: Not Found if GA property doesn't exist or is already deleted
 *   - 500: Internal Server Error if operation fails
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string; propertyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, accountId, propertyId } = await params;
    console.log('Delete GA Property - Params:', { id, accountId, propertyId });

    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Find the GA property and related account to verify ownership and permissions
    const gaProperty = await prisma.gaProperty.findFirst({
      where: {
        id: propertyId,
        gaAccountId: accountId,
        deleted: false,
      },
      include: {
        gaAccount: {
          include: {
            userToGaAccounts: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!gaProperty) {
      return new NextResponse('GA Property not found or already deleted', { status: 404 });
    }

    // Authorization logic
    let canDelete = false;

    if (currentUser.role.name === 'ADMIN') {
      canDelete = true;
    } else if (currentUser.role.name === 'ACCOUNT_REP') {
      // Account reps can delete GA properties for any of their clients
      // Check if any user associated with this GA account has this account rep
      const hasClientWithThisAccountRep = gaProperty.gaAccount.userToGaAccounts.some(
        userToGaAccount => userToGaAccount.user.accountRepId === currentUser.id
      );
      if (hasClientWithThisAccountRep) {
        canDelete = true;
      }
    } else if (currentUser.role.name === 'CLIENT') {
      // Clients can only delete their own GA properties
      const userAccount = gaProperty.gaAccount.userToGaAccounts[0]?.user;
      if (userAccount?.id === currentUser.id) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      console.log('Delete GA Property - Access denied:', {
        currentUserRole: currentUser.role.name,
        currentUserId: currentUser.id,
        requestedUserId: id,
        gaAccountUsers: gaProperty.gaAccount.userToGaAccounts.map(uta => ({
          userId: uta.user.id,
          accountRepId: uta.user.accountRepId
        }))
      });
      return new NextResponse('Forbidden - Insufficient permissions', { status: 403 });
    }

    // Perform soft delete
    await prisma.gaProperty.update({
      where: { id: propertyId },
      data: { deleted: true },
    });

    console.log('Delete GA Property - Successfully soft deleted property:', propertyId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error soft deleting GA property:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 