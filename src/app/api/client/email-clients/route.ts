/**
 * @file src/app/api/client/email-clients/route.ts
 * API endpoint for fetching Email Clients associated with the current client user.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/email-clients
 * 
 * Fetches Email Clients associated with the current client user.
 * 
 * Authentication:
 * - Requires valid session with CLIENT role
 * 
 * Response:
 * - 200: Returns array of Email Clients associated with the user
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 500: Server error
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check client role
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden: Client access required' }, { status: 403 });
    }

    // Fetch user's Email Clients
    const userWithEmailClients = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        emailClients: {
          include: {
            emailClient: true,
          },
        },
      },
    });

    if (!userWithEmailClients) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data to return just the Email Clients
    const emailClients = userWithEmailClients.emailClients.map(
      ({ emailClient }) => emailClient
    );

    return NextResponse.json(emailClients);
  } catch (error) {
    console.error('Error fetching client Email Clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 