/**
 * @file src/app/api/admin/client-ga-metrics/route.ts
 * Admin API endpoint for fetching Google Analytics metrics for a specific client.
 * Based on the client GA metrics API but with admin-level access controls.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GaMetricsResponse, GaMetricsError } from '@/lib/types/ga-metrics';

interface LLMDashboardResponse {
  runID: string;
  gaPropertyId: string;
  datasets: Array<{
    table: string;
    rows: string;
  }>;
}

// Helper function to transform LLM dashboard data
function transformLLMDashboardData(llmResponse: LLMDashboardResponse | LLMDashboardResponse[]): {
  kpiDaily: any[] | null;
  kpiMonthly: any[] | null;
  channelDaily: any[] | null;
  sourceDaily: any[] | null;
} {
  let kpiDaily: any[] = [];
  let kpiMonthly: any[] = [];
  let channelDaily: any[] = [];
  let sourceDaily: any[] = [];

  try {

    const defaultMetrics = {
      sessions: 0,
      screenPageViewsPerSession: 0,
      engagementRate: 0,
      avgSessionDurationSec: 0,
      goalCompletions: 0,
      goalCompletionRate: 0
    };

    // If the response is an array, use the first object
    let normalizedResponse: LLMDashboardResponse;
    if (Array.isArray(llmResponse)) {
      if (llmResponse.length === 0) {
        throw new Error('LLM response array is empty');
      }
      normalizedResponse = llmResponse[0];
    } else {
      normalizedResponse = llmResponse;
    }

    // Validate response structure
    if (!normalizedResponse || typeof normalizedResponse !== 'object') {
      throw new Error('Invalid response format: Response is not an object');
    }

    if (!Array.isArray(normalizedResponse.datasets)) {
      throw new Error('Invalid response format: datasets is not an array');
    } else {
      // Process each dataset from the LLM response
      normalizedResponse.datasets.forEach(processDataset);
    }

    return {
      kpiDaily: kpiDaily.length > 0 ? kpiDaily : null,
      kpiMonthly: kpiMonthly.length > 0 ? kpiMonthly : null,
      channelDaily: channelDaily.length > 0 ? channelDaily : null,
      sourceDaily: sourceDaily.length > 0 ? sourceDaily : null
    };
  } catch (error) {
    console.error('Transform LLM Data - Error during transformation:', error);
    throw new Error('Failed to transform LLM dashboard data');
  }

  // Helper function to process a single dataset
  function processDataset(dataset: any) {
    try {
      // Dynamically find the table key
      const tableKey = Object.keys(dataset).find(
        (k) => k.replace(/\s+/g, '').toLowerCase() === 'table'
      );
      // Dynamically find the rows/row key
      const rowsKey = Object.keys(dataset).find(
        (k) => k.replace(/\s+/g, '').toLowerCase() === 'rows' || k.replace(/\s+/g, '').toLowerCase() === 'row'
      );
      if (!tableKey || !rowsKey) {
        return;
      }
      const tableName = (dataset[tableKey] || '').trim().toLowerCase();
      let rowsRaw = dataset[rowsKey];

      let rows: any[];
      try {
        rows = typeof rowsRaw === 'string' ? JSON.parse(rowsRaw) : rowsRaw;
      } catch (e) {
        console.error('Transform LLM Data - Error parsing rows:', e);
        return;
      }

      if (!Array.isArray(rows)) {
        console.error('Transform LLM Data - Rows is not an array after parsing');
        return;
      }

      switch(tableName) {
        case 'daily_metrics':
        case 'kpi_daily':
        case 'daily':
          if (rows.length > 0) {
            kpiDaily = rows.map(day => ({
              date: day.date,
              sessions: Number(day.sessions) || 0,
              screenPageViewsPerSession: Number(day.pageviews_per_session || day.screenPageViewsPerSession) || 0,
              engagementRate: Number(day.engagement_rate || day.engagementRate) || 0,
              avgSessionDurationSec: Number(day.avg_session_duration || day.avgSessionDurationSec) || 0,
              goalCompletions: Number(day.goal_completions || day.goalCompletions) || 0,
              goalCompletionRate: Number(day.goal_completion_rate || day.goalCompletionRate) || 0
            }));
          }
          break;

        case 'monthly_metrics':
        case 'kpi_monthly':
        case 'monthly':
          if (rows.length > 0) {
            kpiMonthly = rows.map(month => ({
              month: month.month,
              sessions: Number(month.sessions) || 0,
              screenPageViewsPerSession: Number(month.pageviews_per_session || month.screenPageViewsPerSession) || 0,
              engagementRate: Number(month.engagement_rate || month.engagementRate) || 0,
              avgSessionDurationSec: Number(month.avg_session_duration || month.avgSessionDurationSec) || 0,
              goalCompletions: Number(month.goal_completions || month.goalCompletions) || 0,
              goalCompletionRate: Number(month.goal_completion_rate || month.goalCompletionRate) || 0
            }));
          }
          break;

        case 'channel_metrics':
        case 'channel_daily':
        case 'channel':
        case 'channeldaily':
          channelDaily = rows.map(row => ({
            date: row.date,
            channelGroup: row.channel || row.channelGroup || 'direct',
            sessions: Number(row.sessions) || 0,
            screenPageViewsPerSession: Number(row.pageviews_per_session || row.screenPageViewsPerSession) || 0,
            engagementRate: Number(row.engagement_rate || row.engagementRate) || 0,
            avgSessionDurationSec: Number(row.avg_session_duration || row.avgSessionDurationSec) || 0,
            goalCompletions: Number(row.goal_completions || row.goalCompletions) || 0,
            goalCompletionRate: Number(row.goal_completion_rate || row.goalCompletionRate) || 0
          }));
          break;

        case 'source_metrics':
        case 'source_daily':
        case 'source':
        case 'sourcedaily':
          sourceDaily = rows.map(row => ({
            date: row.date,
            trafficSource: row.source || row.trafficSource || 'direct',
            sessions: Number(row.sessions) || 0,
            screenPageViewsPerSession: Number(row.pageviews_per_session || row.screenPageViewsPerSession) || 0,
            engagementRate: Number(row.engagement_rate || row.engagementRate) || 0,
            avgSessionDurationSec: Number(row.avg_session_duration || row.avgSessionDurationSec) || 0,
            goalCompletions: Number(row.goal_completions || row.goalCompletions) || 0,
            goalCompletionRate: Number(row.goal_completion_rate || row.goalCompletionRate) || 0
          }));
          break;

        default:
          console.log('Transform LLM Data - Unknown table type:', tableName);
      }
    } catch (error) {
      console.error(`Transform LLM Data - Error processing dataset:`, error);
    }
  }
}

/**
 * GET /api/admin/client-ga-metrics
 * 
 * Fetches Google Analytics metrics for a specific client's property.
 * 
 * Query Parameters:
 * - clientId: The ID of the client whose metrics to fetch
 * - propertyId: The GA property ID to fetch metrics for
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - selectedFrom: Display start date (YYYY-MM-DD)
 * - selectedTo: Display end date (YYYY-MM-DD)
 * 
 * Authentication:
 * - Requires valid session with ADMIN role
 * 
 * Response:
 * - 200: Returns GA metrics data
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not admin role)
 * - 400: Missing required parameters
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

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
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

    // Fetch the client and verify they have access to the requested property
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

    // Map and filter userToGaAccounts to get non-deleted gaAccounts
    const gaAccounts = client.userToGaAccounts
      .filter(uta => uta.gaAccount && !uta.gaAccount.deleted)
      .map(uta => uta.gaAccount);

    // Check if client has GA accounts
    if (!gaAccounts.length) {
      console.log('Admin GA Metrics API - No GA accounts found for client');
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

    // Check if data exists in tables (rest of the logic is similar to client API)
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
    
    if (needsHistoricalData) {
      console.log('Admin GA Metrics API - No data found, will fetch 5 years of historical data');
      queryDateFrom = new Date();
      queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 5);
    } else {
      queryDateFrom = new Date(dateFrom);
      queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 1);
    }

    // Continue with the same logic as the client API for fetching/transforming data...
    // For now, let's return the existing data from the database
    
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
        users: 0, // Defaulting to 0 as it's not available in gaChannelDaily
        newUsers: 0, // Defaulting to 0 as it's not available in gaChannelDaily
        channelGroup: item.channelGroup,
        sessions: item.sessions
      })) : null,
      sourceDaily: sourceDaily.length > 0 ? sourceDaily.map(item => ({
        id: item.id,
        date: item.date.toISOString().split('T')[0],
        trafficSource: item.trafficSource,
        sessions: item.sessions,
        users: 0, // Defaulting to 0 as it's not available in gaSourceDaily
        newUsers: 0 // Defaulting to 0 as it's not available in gaSourceDaily
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
    console.error('Admin GA Metrics API - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
} 