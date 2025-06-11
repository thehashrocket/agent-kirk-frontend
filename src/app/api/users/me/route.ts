/**
 * @fileoverview Current User Profile API Route
 * 
 * This route handles fetching the current authenticated user's profile.
 * It includes basic profile information and associated Google Analytics accounts.
 * 
 * @route GET /api/users/me
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET handler for retrieving the current user's profile
 * 
 * @returns {Promise<NextResponse>} JSON response containing user data or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {404} If user is not found in database
 * @throws {500} If there's an internal server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
        gaAccounts: {
          where: {
            deleted: false, // Only include non-deleted accounts
          },
          include: {
            gaProperties: {
              where: {
                deleted: false, // Only include non-deleted properties
              },
            },
          },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 