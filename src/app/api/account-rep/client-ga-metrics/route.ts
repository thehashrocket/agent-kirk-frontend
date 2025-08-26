/**
 * @file src/app/api/account-rep/client-ga-metrics/route.ts
 * Account Rep API endpoint for fetching Google Analytics metrics for their assigned clients.
 * Based on the admin client GA metrics API but with account rep-level access controls.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GaMetricsResponse, GaMetricsError } from '@/lib/types/ga-metrics';

/**
 * GET /api/account-rep/client-ga-metrics
 *
 * Fetches Google Analytics metrics for a specific client's property.
 * Account reps can only access metrics for their assigned clients.
 *
 * Query Parameters:
 * - clientId: The ID of the client whose metrics to fetch (must be assigned to this account rep)
 * - propertyId: The GA property ID to fetch metrics for
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - selectedFrom: Selected start date for display (YYYY-MM-DD)
 * - selectedTo: Selected end date for display (YYYY-MM-DD)
 *
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 * - Client must be assigned to the authenticated account rep
 *
 * Response:
 * - 200: Returns GA metrics data
 * - 400: Bad request (missing parameters)
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role or client not assigned)
 * - 404: Client or property not found
 * - 500: Server error
 */
export async function GET(request: Request): Promise<NextResponse<GaMetricsResponse | GaMetricsError>> {
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
    const requestedPropertyId = searchParams.get('propertyId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required', code: 'MISSING_CLIENT_ID' },
        { status: 400 }
      );
    }

    if (!requestedPropertyId) {
      return NextResponse.json(
        { error: 'Property ID is required', code: 'MISSING_PROPERTY_ID' },
        { status: 400 }
      );
    }

    // Parse date params (extended range)
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Parse selected date range (for display)
    const selectedFromParam = searchParams.get('selectedFrom');
    const selectedToParam = searchParams.get('selectedTo');

    // Use the extended date range for data fetching
    const dateFrom = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = toParam ? new Date(toParam) : new Date();

    // Store selected range for reference (or default to same as full range)
    const displayDateFrom = selectedFromParam ? new Date(selectedFromParam) : dateFrom;
    const displayDateTo = selectedToParam ? new Date(selectedToParam) : dateTo;

    // Fetch the client and verify they are assigned to this account rep
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
      include: {
        userToGaAccounts: {
          include: {
            gaAccount: {
              include: {
                gaProperties: {
                  where: {
                    deleted: false,
                  },
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
      console.log('Account Rep GA Metrics API - Access denied:', {
        clientAccountRepId: client.accountRepId,
        currentUserId: currentUser.id,
        clientId: client.id
      });
      return NextResponse.json(
        { error: 'Forbidden: Client not assigned to this account rep', code: 'CLIENT_NOT_ASSIGNED' },
        { status: 403 }
      );
    }

    // Map and filter userToGaAccounts to get non-deleted gaAccounts
    const gaAccounts = client.userToGaAccounts
      .filter(uta => uta.gaAccount && !uta.gaAccount.deleted)
      .map(uta => uta.gaAccount);

    // Check if client has GA accounts
    if (!gaAccounts.length) {
      console.log('Account Rep GA Metrics API - No GA accounts found for client');
      return NextResponse.json(
        { error: 'No GA account found for client', code: 'NO_GA_ACCOUNT' },
        { status: 404 }
      );
    }

    // Find the requested property
    const requestedProperty = gaAccounts
      .flatMap((account: any) => account.gaProperties)
      .find((property: any) => property.id === requestedPropertyId);

    if (!requestedProperty) {
      return NextResponse.json(
        { error: 'Property not found or not accessible', code: 'PROPERTY_NOT_FOUND' },
        { status: 404 }
      );
    }

    const parentAccount = gaAccounts.find((account: any) =>
      account.gaProperties.some((prop: any) => prop.id === requestedPropertyId)
    );

    if (!parentAccount) {
      return NextResponse.json(
        { error: 'Parent account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const gaPropertyId = requestedProperty.id;
    const accountGA4 = parentAccount.gaAccountId;
    const propertyGA4 = requestedProperty.gaPropertyId;

    // Check if data exists in tables
    const [kpiDailyCount, kpiMonthlyCount, channelDailyCount, sourceDailyCount] = await Promise.all([
      prisma.gaKpiDaily.count({ where: { gaPropertyId } }),
      prisma.gaKpiMonthly.count({ where: { gaPropertyId } }),
      prisma.gaChannelDaily.count({ where: { gaPropertyId } }),
      prisma.gaSourceDaily.count({ where: { gaPropertyId } })
    ]);

    // Determine if we need to fetch historical data
    const needsHistoricalData = kpiDailyCount === 0 || kpiMonthlyCount === 0 ||
      channelDailyCount === 0 || sourceDailyCount === 0;

    // Set date ranges based on what we need
    let queryDateFrom: Date;
    let queryDateTo: Date = new Date(); // Always use today as the end date

    queryDateFrom = new Date(dateFrom);
    queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 1);

    console.log('queryDateFrom', queryDateFrom);
    console.log('queryDateTo', queryDateTo);

    // Fetch existing data from the database
    const [kpiDaily, kpiMonthly, channelDaily, sourceDaily] = await Promise.all([
      prisma.gaKpiDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.gaKpiMonthly.findMany({
        where: {
          gaPropertyId,
          month: {
            gte: queryDateFrom.getFullYear() * 100 + (queryDateFrom.getMonth() + 1),
            lte: queryDateTo.getFullYear() * 100 + (queryDateTo.getMonth() + 1)
          }
        },
        orderBy: { month: 'asc' }
      }),
      prisma.gaChannelDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.gaSourceDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'asc' }
      })
    ]);

    const response: GaMetricsResponse = {
      kpiDaily: kpiDaily.length > 0 ? kpiDaily.map(item => ({
        id: item.id,
        date: item.date.toISOString().split('T')[0],
        sessions: item.sessions,
        screenPageViewsPerSession: item.screenPageViewsPerSession,
        avgSessionDurationSec: item.avgSessionDurationSec,
        engagementRate: item.engagementRate,
        goalCompletions: item.goalCompletions,
        goalCompletionRate: item.goalCompletionRate
      })) : null,
      kpiMonthly: kpiMonthly.length > 0 ? kpiMonthly.map(item => ({
        id: item.id,
        month: item.month,
        sessions: item.sessions,
        screenPageViewsPerSession: item.screenPageViewsPerSession,
        avgSessionDurationSec: item.avgSessionDurationSec,
        engagementRate: item.engagementRate,
        goalCompletions: item.goalCompletions,
        goalCompletionRate: item.goalCompletionRate
      })) : null,
      channelDaily: channelDaily.length > 0 ? channelDaily.map(item => ({
        id: item.id,
        date: item.date.toISOString().split('T')[0],
        channelGroup: item.channelGroup,
        sessions: item.sessions,
        users: item.users,
        newUsers: item.newUsers
      })) : null,
      sourceDaily: sourceDaily.length > 0 ? sourceDaily.map(item => ({
        id: item.id,
        date: item.date.toISOString().split('T')[0],
        trafficSource: item.trafficSource,
        sessions: item.sessions,
        users: item.users,
        newUsers: item.newUsers
      })) : null,
      metadata: {
        displayDateRange: {
          from: displayDateFrom.toISOString().split('T')[0],
          to: displayDateTo.toISOString().split('T')[0]
        },
        fullDateRange: {
          from: queryDateFrom.toISOString().split('T')[0],
          to: queryDateTo.toISOString().split('T')[0]
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Account Rep GA Metrics API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
