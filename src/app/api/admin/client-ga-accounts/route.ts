/**
 * @file src/app/api/admin/client-ga-accounts/route.ts
 * API endpoint for administrators to fetch Google Analytics accounts for a specific client.
 * Provides admin-level access to any client's GA account data.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/client-ga-accounts
 * 
 * Fetches Google Analytics accounts and properties for a specific client.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose GA accounts to fetch
 * 
 * Authentication:
 * - Requires valid session with ADMIN role
 * 
 * Response:
 * - 200: Returns client data with GA accounts and properties
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not admin role)
 * - 404: Client not found
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get client ID from query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Fetch the client with their GA accounts and properties
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        userToGaAccounts: {
          include: {
            gaAccount: {
              include: {
                gaProperties: {
                  where: { deleted: false },
                },
              },
            },
          },
        },
        role: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify the user is actually a client
    if (client.role.name !== 'CLIENT') {
      return NextResponse.json({ error: 'User is not a client' }, { status: 400 });
    }

    // Return the client data with GA accounts
    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      gaAccounts: client.userToGaAccounts.map((uta: { gaAccount: any }) => uta.gaAccount),
    });

  } catch (error) {
    console.error('Error fetching client GA accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 