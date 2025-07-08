/**
 * @file src/app/api/admin/available-sprout-social-accounts/route.ts
 * API endpoint for fetching available Sprout Social accounts that can be assigned to clients.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/available-sprout-social-accounts
 * 
 * Fetches all available Sprout Social accounts that can be assigned to clients.
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 200: Returns array of available Sprout Social accounts
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not admin/account rep role)
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin/account rep role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
    }

    // Fetch all Sprout Social accounts
    const sproutSocialAccounts = await prisma.sproutSocialAccount.findMany({
      orderBy: [
        { networkType: 'asc' },
        { name: 'asc' }
      ],
    });

    return NextResponse.json(sproutSocialAccounts);
  } catch (error) {
    console.error('Error fetching available Sprout Social accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 