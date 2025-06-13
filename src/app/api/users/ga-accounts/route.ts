/**
 * @fileoverview Google Analytics Account API Route
 * 
 * This route handles the creation of Google Analytics accounts for users.
 * It provides endpoints for creating new GA accounts with validation and error handling.
 * All endpoints require authentication via NextAuth session.
 * 
 * @route POST /api/users/ga-accounts - Create a new GA account
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Interface for GA account creation request
 * @interface GaAccountRequest
 * @property {string} gaAccountId - The Google Analytics account ID
 * @property {string} gaAccountName - The display name for the GA account
 */
interface GaAccountRequest {
  gaAccountId: string;
  gaAccountName: string;
}

/**
 * Creates a new Google Analytics account for the authenticated user.
 * 
 * @async
 * @param {Request} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing the created GA account or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If required fields are missing
 * @throws {500} If server encounters an error during creation
 * 
 * @example
 * POST /api/users/ga-accounts
 * {
 *   "gaAccountId": "123456789",
 *   "gaAccountName": "My Analytics Account"
 * }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { gaAccountId, gaAccountName } = await req.json();

    if (!gaAccountId || !gaAccountName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const gaAccount = await prisma.gaAccount.create({
      data: {
        gaAccountId,
        gaAccountName,
        userToGaAccounts: {
          create: {
            userId: session.user.id
          }
        }
      },
    });

    return NextResponse.json(gaAccount);
  } catch (error) {
    console.error('Error adding GA account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 