/**
 * @file src/app/api/client/sprout-social-accounts/route.ts
 * API endpoint for fetching SproutSocial accounts associated with the current client user.
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/sprout-social-accounts
 *
 * Fetches SproutSocial accounts associated with the current client user.
 *
 * Authentication:
 * - Requires valid session with CLIENT role
 *
 * Response:
 * - 200: Returns array of SproutSocial accounts associated with the user
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    // Get clientId from the clientId parameter in the URL
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check client role
    if (session.user.role !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Client access required' }, { status: 403 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Fetch user's SproutSocial accounts
    const userWithSproutSocialAccounts = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        sproutSocialAccounts: {
          include: {
            sproutSocialAccount: true,
          },
        },
      },
    });

    if (!userWithSproutSocialAccounts) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data to return just the SproutSocial accounts
    const sproutSocialAccounts = userWithSproutSocialAccounts.sproutSocialAccounts.map(
      ({ sproutSocialAccount }) => sproutSocialAccount
    );

    return NextResponse.json(sproutSocialAccounts);
  } catch (error) {
    console.error('Error fetching client Social Media accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}