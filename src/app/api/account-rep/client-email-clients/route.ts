/**
 * @file src/app/api/account-rep/client-email-clients/route.ts
 * Account Rep API endpoint for fetching email clients for their assigned clients.
 * Based on the client email clients API but with account rep-level access controls.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/account-rep/client-email-clients
 * 
 * Fetches email clients for a specific client.
 * Account reps can only access email clients for their assigned clients.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose email clients to fetch (must be assigned to this account rep)
 * 
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 * - Client must be assigned to the authenticated account rep
 * 
 * Response:
 * - 200: Returns email clients data
 * - 400: Bad request (missing parameters)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role or client not assigned)
 * - 404: Client not found
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    console.log('Account Rep Email Clients API - Starting request');
    
    // Get authentication
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check account rep role
    if (session.user.role !== 'ACCOUNT_REP') {
      return NextResponse.json(
        { error: 'Forbidden: Account Rep access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get the current account rep user info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Account Rep user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    
    // Get required parameters
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required', code: 'MISSING_CLIENT_ID' },
        { status: 400 }
      );
    }

    // Fetch the client and verify they are assigned to this account rep
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
      include: {
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
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify the user is actually a client
    if (client.role.name !== 'CLIENT') {
      return NextResponse.json(
        { error: 'User is not a client', code: 'NOT_A_CLIENT' },
        { status: 400 }
      );
    }

    // Verify the client is assigned to this account rep
    if (client.accountRepId !== currentUser.id) {
      console.log('Account Rep Email Clients API - Access denied:', {
        clientAccountRepId: client.accountRepId,
        currentUserId: currentUser.id,
        clientId: client.id
      });
      return NextResponse.json(
        { error: 'Forbidden: Client not assigned to this account rep', code: 'CLIENT_NOT_ASSIGNED' },
        { status: 403 }
      );
    }

    // Fetch email clients for the client
    const emailClients = await prisma.emailClient.findMany({
      where: {
        users: {
          some: {
            userId: clientId
          }
        }
      },
      select: {
        id: true,
        clientName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Account Rep Email Clients API - Found email clients:', emailClients.length);

    return NextResponse.json(emailClients);

  } catch (error) {
    console.error('Account Rep Email Clients API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
} 