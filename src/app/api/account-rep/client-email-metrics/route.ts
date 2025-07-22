/**
 * @file src/app/api/account-rep/client-email-metrics/route.ts
 * Account Rep API endpoint for fetching email analytics metrics for their assigned clients.
 * Based on the client email metrics API but with account rep-level access controls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * GET /api/account-rep/client-email-metrics
 * 
 * Fetches email analytics metrics for a specific client's email client.
 * Account reps can only access metrics for their assigned clients.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose metrics to fetch (must be assigned to this account rep)
 * - emailClientId: The email client ID
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
 * - 200: Returns email analytics metrics
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role or client not assigned)
 * - 404: Email client not found or not associated with user
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
    const emailClientId = searchParams.get('emailClientId');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required', code: 'MISSING_CLIENT_ID' },
        { status: 400 }
      );
    }

    if (!emailClientId) {
      return NextResponse.json(
        { error: 'Email Client ID is required', code: 'MISSING_EMAIL_CLIENT_ID' },
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
      console.log('Account Rep Email Metrics API - Access denied:', {
        clientAccountRepId: client.accountRepId,
        currentUserId: currentUser.id,
        clientId: client.id
      });
      return NextResponse.json(
        { error: 'Forbidden: Client not assigned to this account rep', code: 'CLIENT_NOT_ASSIGNED' },
        { status: 403 }
      );
    }

    // Verify the email client belongs to the client
    const emailClient = await prisma.emailClient.findFirst({
      where: {
        id: emailClientId,
        users: {
          some: {
            userId: clientId
          }
        }
      }
    });

    if (!emailClient) {
      return NextResponse.json(
        { error: 'Email client not found or not associated with client', code: 'EMAIL_CLIENT_NOT_FOUND' },
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
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));
      
      startDate = subDays(lastMonthStart, 365); // Get a year of data for comparison
      endDate = lastMonthEnd;
      displayStartDate = lastMonthStart;
      displayEndDate = lastMonthEnd;
    }

    // For now, return a mock response structure similar to the client API
    // In a real implementation, you would fetch actual email data here
    const response = {
      emailClient: {
        id: emailClient.id,
        clientName: emailClient.clientName,
      },
      selectedRange: {
        from: format(displayStartDate, 'yyyy-MM-dd'),
        to: format(displayEndDate, 'yyyy-MM-dd'),
      },
      metrics: {
        current: {
          totalOpens: 0,
          totalClicks: 0,
          totalBounces: 0,
          totalUnsubscribes: 0,
          totalDelivered: 0,
          totalRequests: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
        },
        previousYear: {
          totalOpens: 0,
          totalClicks: 0,
          totalBounces: 0,
          totalUnsubscribes: 0,
          totalDelivered: 0,
          totalRequests: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
        },
        yearOverYear: {
          opens: 0,
          clicks: 0,
          bounces: 0,
          unsubscribes: 0,
          openRate: 0,
          clickRate: 0,
        },
      },
      timeSeriesData: [],
      topCampaigns: [],
      totalCampaigns: 0,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Account Rep Email Metrics API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
} 