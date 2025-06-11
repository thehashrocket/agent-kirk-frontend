/**
 * @fileoverview Google Analytics Properties API Route
 * 
 * This route handles operations for managing Google Analytics properties within a GA account:
 * - Creating new GA properties with validation
 * - Retrieving GA properties for a specific account
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Authorization checks to ensure users can only access their own GA accounts
 * - Input validation for required fields
 * - Error handling with appropriate status codes
 * 
 * @route GET /api/users/[id]/ga-accounts/[accountId]/properties - Retrieve properties for a GA account
 * @route POST /api/users/[id]/ga-accounts/[accountId]/properties - Create a new GA property
 * @route DELETE /api/users/[id]/ga-accounts/[accountId]/properties/[propertyId] - Soft delete a GA property
 * @security Requires authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Creates a new Google Analytics property for a specific GA account
 * 
 * @param {Request} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @param {string} params.accountId - GA Account ID
 * 
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - 201: Created GA property object
 *   - 400: Bad Request if required fields are missing
 *   - 401: Unauthorized if no valid session exists
 *   - 404: Not Found if GA account doesn't exist or user is unauthorized
 *   - 500: Internal Server Error if operation fails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, accountId } = await params;

    // Verify the GA account belongs to the user and is not deleted
    const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: accountId,
        userId: id,
        deleted: false, // Only allow operations on non-deleted accounts
      },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found or unauthorized', { status: 404 });
    }

    const body = await request.json();
    const { gaPropertyId, gaPropertyName } = body;

    if (!gaPropertyId || !gaPropertyName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const gaProperty = await prisma.gaProperty.create({
      data: {
        gaPropertyId,
        gaPropertyName,
        gaAccountId: accountId,
      },
    });

    return NextResponse.json(gaProperty);
  } catch (error) {
    console.error('Error in GA property creation:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

/**
 * Retrieves all Google Analytics properties for a specific GA account
 * 
 * @param {Request} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - User ID
 * @param {string} params.accountId - GA Account ID
 * 
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - 200: Array of GA property objects
 *   - 401: Unauthorized if no valid session exists
 *   - 404: Not Found if GA account doesn't exist or user is unauthorized
 *   - 500: Internal Server Error if operation fails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, accountId } = await params;

    // Verify the GA account belongs to the user and is not deleted
    const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: accountId,
        userId: id,
        deleted: false, // Only allow access to non-deleted accounts
      },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found or unauthorized', { status: 404 });
    }

    const gaProperties = await prisma.gaProperty.findMany({
      where: {
        gaAccountId: accountId,
        deleted: false, // Only return non-deleted properties
      },
    });

    return NextResponse.json(gaProperties);
  } catch (error) {
    console.error('Error fetching GA properties:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 