/**
 * @file src/app/api/account-rep/client-ga-accounts/route.ts
 * API endpoint for account representatives to fetch Google Analytics accounts for their assigned clients.
 * Based on the admin client GA accounts API but with account rep-level access controls.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account-rep/client-ga-accounts
 * 
 * Fetches Google Analytics accounts and properties for a specific client.
 * Account reps can only access data for their assigned clients.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose GA accounts to fetch (must be assigned to this account rep)
 * 
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 * - Client must be assigned to the authenticated account rep
 * 
 * Response:
 * - 200: Returns client data with GA accounts and properties
 * - 400: Bad request (missing parameters)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role or client not assigned)
 * - 404: Client not found
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    console.log('Account Rep Client GA Accounts API - Starting request');
    
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check account rep role
    if (session.user.role !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Account Rep access required' }, { status: 403 });
    }

    // Get the current account rep user info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Account Rep user not found' }, { status: 404 });
    }

    // Get client ID from query parameters
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    console.log('Account Rep Client GA Accounts API - Fetching client:', clientId);
    console.log('Account Rep Client GA Accounts API - Current user ID:', currentUser.id);

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
        accountRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify the user is actually a client
    if (client.role.name !== 'CLIENT') {
      return NextResponse.json({ error: 'User is not a client' }, { status: 400 });
    }

    // Verify the client is assigned to this account rep
    if (client.accountRepId !== currentUser.id) {
      console.log('Account Rep Client GA Accounts API - Access denied:', {
        clientAccountRepId: client.accountRepId,
        currentUserId: currentUser.id,
        clientId: client.id
      });
      return NextResponse.json({ 
        error: 'Forbidden: Client not assigned to this account rep' 
      }, { status: 403 });
    }

    console.log('Account Rep Client GA Accounts API - Access granted for client:', client.id);
    console.log('Account Rep Client GA Accounts API - GA accounts count:', client.userToGaAccounts.length);

    // Return the client data with GA accounts
    return NextResponse.json({
      id: client.id,
      name: client.name,
      email: client.email,
      gaAccounts: client.userToGaAccounts.map((uta: { gaAccount: any }) => uta.gaAccount),
    });

  } catch (error) {
    console.error('Account Rep Client GA Accounts API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 