/**
 * @file src/app/api/client/direct-mail-metrics/route.ts
 * API endpoint for fetching Direct Mail analytics metrics for the current client user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';

/**
 * GET /api/account-rep/direct-mail-metrics
 *
 * Fetches Direct Mail analytics metrics for the current client user.
 *
 * Query Parameters:
 * - accountId: The USPS client ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 *
 * Authentication:
 * - Requires valid session with CLIENT role
 *
 * Response:
 * - 200: Returns Direct Mail analytics metrics with tabular data
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
        if (session.user.role !== 'ACCOUNT_REP') {
            return NextResponse.json({ error: 'Forbidden: Client access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');
        const clientId = searchParams.get('clientId');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }
        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Verify user has access to this USPS client
        const userAccountAssociation = await prisma.userToUspsClient.findFirst({
            where: {
                userId: clientId,
                uspsClientId: accountId,
            },
            include: {
                uspsClient: true,
            },
        });

        if (!userAccountAssociation) {
            return NextResponse.json({ error: 'Direct Mail account not found or not accessible' }, { status: 404 });
        }

        const uspsClient = userAccountAssociation.uspsClient;

        // Parse date parameters for filtering
        const from = fromDate ? parseISO(fromDate) : subDays(new Date(), 30);
        const to = toDate ? parseISO(toDate) : new Date();

        // Fetch campaigns with their summary data
        const campaigns = await prisma.uspsCampaign.findMany({
            where: {
                uspsClientId: accountId,
                sendDate: {
                    gte: from,
                    lte: to,
                },
            },
            include: {
                uspsCampaignSummary: {
                    orderBy: {
                        scanDate: 'desc',
                    },
                    take: 1, // Get the latest summary for each campaign
                },
            },
            orderBy: {
                sendDate: 'desc',
            },
        });

        // Transform data into tabular format
        const tableData = campaigns.map(campaign => {
            const latestSummary = campaign.uspsCampaignSummary[0];

            return {
                campaignName: campaign.campaignName,
                delivered: latestSummary?.numberDelivered || 0,
                finalScanCount: latestSummary?.finalScanCount || 0,
                lastScanDate: latestSummary ? format(latestSummary.scanDate, 'yyyy-MM-dd') : 'N/A',
                order: campaign.order,
                percentDelivered: latestSummary?.percentDelivered || 0,
                percentFinalScan: latestSummary?.percentFinalScan || 0,
                percentOnTime: latestSummary?.percentOnTime || 0,
                percentScanned: latestSummary?.percentScanned || 0,
                pieces: latestSummary?.pieces || 0,
                reportId: campaign.reportId,
                scanned: latestSummary?.totalScanned || 0,
                sector: campaign.sector,
                sendDate: format(campaign.sendDate, 'yyyy-MM-dd'),
                totalSent: latestSummary?.pieces || 0,
                type: campaign.type,
            };
        });

        // Calculate summary statistics
        const totalCampaigns = tableData.length;
        const totalSent = tableData.reduce((sum, row) => sum + row.totalSent, 0);
        const totalScanned = tableData.reduce((sum, row) => sum + row.scanned, 0);
        const totalDelivered = tableData.reduce((sum, row) => sum + row.delivered, 0);
        const avgPercentOnTime = totalCampaigns > 0
            ? tableData.reduce((sum, row) => sum + row.percentOnTime, 0) / totalCampaigns
            : 0;
        const avgPercentDelivered = totalCampaigns > 0
            ? tableData.reduce((sum, row) => sum + row.percentDelivered, 0) / totalCampaigns
            : 0;

        const response = {
            account: uspsClient,
            dateRange: {
                from: format(from, 'yyyy-MM-dd'),
                to: format(to, 'yyyy-MM-dd'),
            },
            tableData,
            summary: {
                totalCampaigns,
                totalSent,
                totalScanned,
                totalDelivered,
                avgPercentOnTime: Math.round(avgPercentOnTime * 100) / 100,
                avgPercentDelivered: Math.round(avgPercentDelivered * 100) / 100,
                scanRate: totalSent > 0 ? Math.round((totalScanned / totalSent) * 10000) / 100 : 0,
                // Calculate deliveryRate as percentage of the number sccanned that were sent
                deliveryRate: totalScanned > 0 ? Math.round((totalScanned / totalSent) * 10000) / 100 : 0,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching Direct Mail metrics:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
