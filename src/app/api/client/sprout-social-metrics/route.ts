/**
 * @file src/app/api/client/sprout-social-metrics/route.ts
 * API endpoint for fetching SproutSocial analytics metrics for the current client user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * GET /api/client/sprout-social-metrics
 * 
 * Fetches SproutSocial analytics metrics for the current client user.
 * 
 * Query Parameters:
 * - accountId: The SproutSocial account ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 * - selectedFrom: Original selected start date for display
 * - selectedTo: Original selected end date for display
 * 
 * Authentication:
 * - Requires valid session with CLIENT role
 * 
 * Response:
 * - 200: Returns SproutSocial analytics metrics
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 404: Account not found or not associated with user
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const selectedFrom = searchParams.get('selectedFrom');
    const selectedTo = searchParams.get('selectedTo');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Verify user has access to this SproutSocial account
    const userAccountAssociation = await prisma.userToSproutSocialAccount.findFirst({
      where: {
        userId: session.user.id,
        sproutSocialAccountId: accountId,
      },
      include: {
        sproutSocialAccount: true,
      },
    });

    if (!userAccountAssociation) {
      return NextResponse.json({ error: 'SproutSocial account not found or not accessible' }, { status: 404 });
    }

    const sproutSocialAccount = userAccountAssociation.sproutSocialAccount;

    // Set default date range if not provided (previous month)
    let startDate: Date;
    let endDate: Date;
    let displayStartDate: Date;
    let displayEndDate: Date;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      displayStartDate = selectedFrom ? new Date(selectedFrom) : startDate;
      displayEndDate = selectedTo ? new Date(selectedTo) : endDate;
    } else {
      const today = new Date();
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));
      
      startDate = subDays(lastMonthStart, 365); // Get a year of data for comparison
      endDate = lastMonthEnd;
      displayStartDate = lastMonthStart;
      displayEndDate = lastMonthEnd;
    }

    // Fetch analytics data based on platform type
    const platformMetrics = await fetchPlatformMetrics(
      sproutSocialAccount.networkType,
      sproutSocialAccount.customerProfileId,
      startDate,
      endDate
    );

    // Calculate metrics for the selected period and comparison period
    const selectedPeriodMetrics = filterMetricsByPeriod(platformMetrics, displayStartDate, displayEndDate);
    const comparisonStartDate = new Date(displayStartDate);
    comparisonStartDate.setDate(comparisonStartDate.getDate() - (displayEndDate.getTime() - displayStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const comparisonEndDate = new Date(displayStartDate);
    comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
    const comparisonMetrics = filterMetricsByPeriod(platformMetrics, comparisonStartDate, comparisonEndDate);

    const response = {
      account: sproutSocialAccount,
      dateRange: {
        start: format(displayStartDate, 'yyyy-MM-dd'),
        end: format(displayEndDate, 'yyyy-MM-dd'),
      },
      metrics: selectedPeriodMetrics,
      comparisonMetrics: comparisonMetrics,
      platformType: sproutSocialAccount.networkType,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching SproutSocial metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch platform-specific metrics
 */
async function fetchPlatformMetrics(
  platformType: string,
  customerProfileId: number,
  startDate: Date,
  endDate: Date
) {
  const whereClause = {
    customerProfileId,
    reportingDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  switch (platformType.toLowerCase()) {
    case 'facebook':
      return await prisma.sproutFacebookAnalytics.findMany({
        where: whereClause,
        orderBy: { reportingDate: 'asc' },
      });
    case 'instagram':
    case 'fb_instagram_account':
      return await prisma.sproutInstagramAnalytics.findMany({
        where: whereClause,
        orderBy: { reportingDate: 'asc' },
      });
    case 'linkedin':
    case 'linkedin_company':
      return await prisma.sproutLinkedInAnalytics.findMany({
        where: whereClause,
        orderBy: { reportingDate: 'asc' },
      });
    case 'pinterest':
      return await prisma.sproutPinterestAnalytics.findMany({
        where: whereClause,
        orderBy: { reportingDate: 'asc' },
      });
    default:
      return [];
  }
}

/**
 * Filter metrics by date period
 */
function filterMetricsByPeriod(metrics: any[], startDate: Date, endDate: Date) {
  return metrics.filter(metric => {
    const reportingDate = new Date(metric.reportingDate);
    return reportingDate >= startDate && reportingDate <= endDate;
  });
} 