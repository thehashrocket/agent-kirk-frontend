/**
 * @file src/app/api/account-rep/client-sprout-social-metrics/route.ts
 * Account Rep API endpoint for fetching SproutSocial analytics metrics for their assigned clients.
 * Based on the client SproutSocial metrics API but with account rep-level access controls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * GET /api/account-rep/client-sprout-social-metrics
 * 
 * Fetches SproutSocial analytics metrics for a specific client's account.
 * Account reps can only access metrics for their assigned clients.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose metrics to fetch (must be assigned to this account rep)
 * - accountId: The SproutSocial account ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 * - selectedFrom: Original selected start date for display
 * - selectedTo: Original selected end date for display
 * 
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 * - Client must be assigned to the authenticated account rep
 * 
 * Response:
 * - 200: Returns SproutSocial analytics metrics
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role or client not assigned)
 * - 404: Account not found or not associated with user
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    
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
    const accountId = searchParams.get('accountId');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required', code: 'MISSING_CLIENT_ID' },
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required', code: 'MISSING_ACCOUNT_ID' },
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
      console.log('Account Rep Social Media Metrics API - Access denied:', {
        clientAccountRepId: client.accountRepId,
        currentUserId: currentUser.id,
        clientId: client.id
      });
      return NextResponse.json(
        { error: 'Forbidden: Client not assigned to this account rep', code: 'CLIENT_NOT_ASSIGNED' },
        { status: 403 }
      );
    }

    // Verify the SproutSocial account belongs to the client
    const sproutSocialAccount = await prisma.sproutSocialAccount.findFirst({
      where: {
        id: accountId,
        users: {
          some: {
            userId: clientId
          }
        }
      }
    });

    if (!sproutSocialAccount) {
      return NextResponse.json(
        { error: 'Social Media account not found or not associated with client', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse date parameters
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const selectedFromParam = searchParams.get('selectedFrom');
    const selectedToParam = searchParams.get('selectedTo');
    
    let startDate: Date;
    let endDate: Date;
    let displayStartDate: Date;
    let displayEndDate: Date;

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      endDate = new Date(toParam);
      displayStartDate = selectedFromParam ? new Date(selectedFromParam) : startDate;
      displayEndDate = selectedToParam ? new Date(selectedToParam) : endDate;
    } else {
      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = endOfMonth(today);
      
      startDate = subDays(currentMonthStart, 365); // Get a year of data for comparison
      endDate = currentMonthEnd;
      displayStartDate = currentMonthStart;
      displayEndDate = currentMonthEnd;
    }

    // For now, return a mock response structure similar to the client API
    // In a real implementation, you would fetch actual SproutSocial data here
    const response = {
      account: sproutSocialAccount,
      dateRange: {
        from: format(displayStartDate, 'yyyy-MM-dd'),
        to: format(displayEndDate, 'yyyy-MM-dd'),
      },
      metrics: [], // This would be populated with actual metrics data
      comparisonMetrics: [], // This would be populated with comparison data
      platformType: sproutSocialAccount.networkType,
    };


    return NextResponse.json(response);

  } catch (error) {
    console.error('Account Rep Social Media Metrics API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
} 