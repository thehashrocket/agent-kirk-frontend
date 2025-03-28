/**
 * @fileoverview API route handler for managing user roles in the system.
 * This route provides endpoints for retrieving all available roles.
 * Requires authentication via NextAuth session.
 * 
 * @route /api/roles
 * @module api/roles
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * Response type for successful role retrieval
 */
type RolesResponse = {
  id: string;
  name: string;
  // Add other role properties as needed
}[];

/**
 * Error response type
 */
type ErrorResponse = {
  error: string;
};

/**
 * GET /api/roles
 * Retrieves all available roles in the system.
 * 
 * @async
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse<RolesResponse | ErrorResponse>>} A promise that resolves to either:
 *   - 200: Array of role objects
 *   - 401: Unauthorized error if no valid session exists
 *   - 500: Internal server error if database operation fails
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<RolesResponse | ErrorResponse>> {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 