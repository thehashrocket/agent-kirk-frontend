/**
 * @fileoverview Google Analytics Account API Route
 * 
 * This route handles operations for managing individual Google Analytics accounts:
 * - Deleting GA accounts with proper authorization checks
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Authorization checks to ensure users can only delete their own GA accounts
 * - Error handling with appropriate status codes
 * 
 * @route DELETE /api/users/ga-accounts/[id] - Delete a GA account
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Deletes a Google Analytics account for the authenticated user
 * 
 * @param {Request} req - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - GA Account ID to delete
 * 
 * @returns {Promise<NextResponse>} Response with appropriate status:
 *   - 204: Successfully deleted
 *   - 401: Unauthorized if no valid session or user doesn't own the account
 *   - 404: Not Found if GA account doesn't exist
 *   - 500: Internal Server Error if deletion fails
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const gaAccount = await prisma.gaAccount.findUnique({
      where: { id: params.id },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found', { status: 404 });
    }

    // Ensure the user owns this GA account
    if (gaAccount.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.gaAccount.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting GA account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 