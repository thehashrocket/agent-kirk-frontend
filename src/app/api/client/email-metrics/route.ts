/**
 * @file src/app/api/client/email-metrics/route.ts
 * API endpoint for fetching email analytics metrics for the current client user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/client/email-metrics
 * 
 * Fetches email analytics metrics for the current client user.
 * 
 * Query Parameters:
 * - emailClientId: The Email Client ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 * - selectedFrom: Original selected start date for display
 * - selectedTo: Original selected end date for display
 * 
 * Authentication:
 * - Requires valid session with CLIENT role
 * 
 * Response:
 * - 200: Returns email analytics metrics
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 404: Email Client not found or not associated with user
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
    const emailClientId = searchParams.get('emailClientId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const selectedFrom = searchParams.get('selectedFrom');
    const selectedTo = searchParams.get('selectedTo');

    if (!emailClientId) {
      return NextResponse.json({ error: 'Email Client ID is required' }, { status: 400 });
    }

    // Verify user has access to this Email Client
    const userEmailClientAssociation = await prisma.userToEmailClient.findFirst({
      where: {
        userId: session.user.id,
        emailClientId: emailClientId,
      },
      include: {
        emailClient: true,
      },
    });

    if (!userEmailClientAssociation) {
      return NextResponse.json({ error: 'Email Client not found or not accessible' }, { status: 404 });
    }

    const emailClient = userEmailClientAssociation.emailClient;

    // Parse date parameters
    const from = fromDate ? parseISO(fromDate) : new Date();
    const to = toDate ? parseISO(toDate) : new Date();
    const selectedFromDate = selectedFrom ? parseISO(selectedFrom) : from;
    const selectedToDate = selectedTo ? parseISO(selectedTo) : to;

    // Fetch email campaign daily stats for the date range
    const emailCampaignDailyStats = await prisma.emailCampaignDailyStats.findMany({
      where: {
        emailClientId: emailClientId,
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        emailCampaign: {
          select: {
            campaignName: true,
            campaignId: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch email global daily stats for the date range
    const emailGlobalDailyStats = await prisma.emailGlobalDailyStats.findMany({
      where: {
        emailClientId: emailClientId,
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Aggregate data for the selected date range
    const selectedRangeStats = emailCampaignDailyStats.filter(stat => 
      stat.date >= selectedFromDate && stat.date <= selectedToDate
    );

    const previousYearStats = emailCampaignDailyStats.filter(stat => {
      const statDate = new Date(stat.date);
      const previousYearDate = new Date(selectedFromDate);
      previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);
      const previousYearEndDate = new Date(selectedToDate);
      previousYearEndDate.setFullYear(previousYearEndDate.getFullYear() - 1);
      
      return statDate >= previousYearDate && statDate <= previousYearEndDate;
    });

    // Calculate metrics for selected range
    const selectedRangeMetrics = {
      totalOpens: selectedRangeStats.reduce((sum, stat) => sum + stat.opens, 0),
      totalClicks: selectedRangeStats.reduce((sum, stat) => sum + stat.clicks, 0),
      totalBounces: selectedRangeStats.reduce((sum, stat) => sum + stat.bounces, 0),
      totalUnsubscribes: selectedRangeStats.reduce((sum, stat) => sum + stat.unsubscribes, 0),
      totalDelivered: selectedRangeStats.reduce((sum, stat) => sum + stat.delivered, 0),
      totalRequests: selectedRangeStats.reduce((sum, stat) => sum + stat.requests, 0),
      averageOpenRate: selectedRangeStats.length > 0 
        ? selectedRangeStats.reduce((sum, stat) => sum + (stat.dailyTotalOpenRate || 0), 0) / selectedRangeStats.length / 100
        : 0,
      averageClickRate: selectedRangeStats.length > 0
        ? selectedRangeStats.reduce((sum, stat) => sum + (stat.dailyTotalClickRate || 0), 0) / selectedRangeStats.length / 100
        : 0,
    };

    // Calculate metrics for previous year
    const previousYearMetrics = {
      totalOpens: previousYearStats.reduce((sum, stat) => sum + stat.opens, 0),
      totalClicks: previousYearStats.reduce((sum, stat) => sum + stat.clicks, 0),
      totalBounces: previousYearStats.reduce((sum, stat) => sum + stat.bounces, 0),
      totalUnsubscribes: previousYearStats.reduce((sum, stat) => sum + stat.unsubscribes, 0),
      totalDelivered: previousYearStats.reduce((sum, stat) => sum + stat.delivered, 0),
      totalRequests: previousYearStats.reduce((sum, stat) => sum + stat.requests, 0),
      averageOpenRate: previousYearStats.length > 0
        ? previousYearStats.reduce((sum, stat) => sum + (stat.dailyTotalOpenRate || 0), 0) / previousYearStats.length / 100
        : 0,
      averageClickRate: previousYearStats.length > 0
        ? previousYearStats.reduce((sum, stat) => sum + (stat.dailyTotalClickRate || 0), 0) / previousYearStats.length / 100
        : 0,
    };

    // Calculate year-over-year changes
    const yearOverYearChanges = {
      opens: previousYearMetrics.totalOpens > 0 
        ? ((selectedRangeMetrics.totalOpens - previousYearMetrics.totalOpens) / previousYearMetrics.totalOpens) * 100
        : 0,
      clicks: previousYearMetrics.totalClicks > 0
        ? ((selectedRangeMetrics.totalClicks - previousYearMetrics.totalClicks) / previousYearMetrics.totalClicks) * 100
        : 0,
      bounces: previousYearMetrics.totalBounces > 0
        ? ((selectedRangeMetrics.totalBounces - previousYearMetrics.totalBounces) / previousYearMetrics.totalBounces) * 100
        : 0,
      unsubscribes: previousYearMetrics.totalUnsubscribes > 0
        ? ((selectedRangeMetrics.totalUnsubscribes - previousYearMetrics.totalUnsubscribes) / previousYearMetrics.totalUnsubscribes) * 100
        : 0,
      openRate: previousYearMetrics.averageOpenRate > 0
        ? ((selectedRangeMetrics.averageOpenRate - previousYearMetrics.averageOpenRate) / previousYearMetrics.averageOpenRate) * 100
        : 0,
      clickRate: previousYearMetrics.averageClickRate > 0
        ? ((selectedRangeMetrics.averageClickRate - previousYearMetrics.averageClickRate) / previousYearMetrics.averageClickRate) * 100
        : 0,
    };

    // Group data by date for time series
    const dailyData = emailCampaignDailyStats.reduce((acc, stat) => {
      const dateKey = format(new Date(stat.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          opens: 0,
          clicks: 0,
          bounces: 0,
          unsubscribes: 0,
          delivered: 0,
          requests: 0,
        };
      }
      acc[dateKey].opens += stat.opens;
      acc[dateKey].clicks += stat.clicks;
      acc[dateKey].bounces += stat.bounces;
      acc[dateKey].unsubscribes += stat.unsubscribes;
      acc[dateKey].delivered += stat.delivered;
      acc[dateKey].requests += stat.requests;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by date
    const timeSeriesData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get top campaigns by opens
    const campaignStats = emailCampaignDailyStats.reduce((acc, stat) => {
      const campaignKey = stat.emailCampaign.campaignId;
      if (!acc[campaignKey]) {
        acc[campaignKey] = {
          campaignId: campaignKey,
          campaignName: stat.emailCampaign.campaignName,
          opens: 0,
          clicks: 0,
          bounces: 0,
          unsubscribes: 0,
          delivered: 0,
        };
      }
      acc[campaignKey].opens += stat.opens;
      acc[campaignKey].clicks += stat.clicks;
      acc[campaignKey].bounces += stat.bounces;
      acc[campaignKey].unsubscribes += stat.unsubscribes;
      acc[campaignKey].delivered += stat.delivered;
      return acc;
    }, {} as Record<string, any>);

    const topCampaigns = Object.values(campaignStats)
      .sort((a, b) => b.opens - a.opens)
      .slice(0, 5);

    return NextResponse.json({
      emailClient: {
        id: emailClient.id,
        clientName: emailClient.clientName,
      },
      selectedRange: {
        from: format(selectedFromDate, 'yyyy-MM-dd'),
        to: format(selectedToDate, 'yyyy-MM-dd'),
      },
      metrics: {
        current: selectedRangeMetrics,
        previousYear: previousYearMetrics,
        yearOverYear: yearOverYearChanges,
      },
      timeSeriesData,
      topCampaigns,
      totalCampaigns: Object.keys(campaignStats).length,
    });
  } catch (error) {
    console.error('Error fetching email metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 