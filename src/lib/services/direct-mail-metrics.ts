/**
 * @file src/lib/services/direct-mail-metrics.ts
 * Shared service for Direct Mail analytics metrics functionality
 */

import { prisma } from '@/lib/prisma';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface DirectMailMetricsParams {
    accountId: string;
    userId: string;
    fromDate?: string;
    toDate?: string;
}

export interface DirectMailMetricsResponse {
    account: any;
    dateRange: {
        from: string;
        to: string;
    };
    tableData: Array<{
        campaignName: string;
        delivered: number;
        finalScanCount: number;
        lastScanDate: string;
        order: string;
        percentDelivered: number;
        percentFinalScan: number;
        percentOnTime: number;
        percentScanned: number;
        pieces: number;
        reportId: string;
        scanned: number;
        sector: string;
        sendDate: string;
        totalSent: number;
        type: string;
    }>;
    summary: {
        totalCampaigns: number;
        totalSent: number;
        totalScanned: number;
        totalDelivered: number;
        avgPercentOnTime: number;
        avgPercentDelivered: number;
        scanRate: number;
        deliveryRate: number;
    };
}

/**
 * Fetches Direct Mail analytics metrics for a given user and account
 *
 * @param params - The parameters for fetching metrics
 * @returns Promise<DirectMailMetricsResponse>
 * @throws Error if account not found or not accessible
 */
export async function getDirectMailMetrics(params: DirectMailMetricsParams): Promise<DirectMailMetricsResponse> {
    const { accountId, userId, fromDate, toDate } = params;

    // Verify user has access to this USPS client
    const userAccountAssociation = await prisma.userToUspsClient.findFirst({
        where: {
            userId: userId,
            uspsClientId: accountId,
        },
        include: {
            uspsClient: true,
        },
    });

    if (!userAccountAssociation) {
        throw new Error('Direct Mail account not found or not accessible');
    }

    const uspsClient = userAccountAssociation.uspsClient;

    // Parse date parameters for filtering
    const from = fromDate ? startOfDay(parseISO(fromDate)) : startOfDay(subDays(new Date(), 30));
    const to = toDate ? endOfDay(parseISO(toDate)) : endOfDay(new Date());

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
            delivered: latestSummary?.finalScanCount || 0,
            finalScanCount: latestSummary?.finalScanCount || 0,
            lastScanDate: latestSummary ? format(latestSummary.scanDate, 'yyyy-MM-dd') : 'N/A',
            order: campaign.order || '',
            percentDelivered: latestSummary?.percentFinalScan || 0,
            percentFinalScan: latestSummary?.percentFinalScan || 0,
            percentOnTime: latestSummary?.percentOnTime || 0,
            percentScanned: latestSummary?.percentScanned || 0,
            pieces: latestSummary?.pieces || 0,
            reportId: campaign.reportId,
            scanned: latestSummary?.totalScanned || 0,
            sector: campaign.sector || '',
            sendDate: format(campaign.sendDate, 'yyyy-MM-dd'),
            totalSent: latestSummary?.pieces || 0,
            type: campaign.type || '',
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

    return {
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
            // Calculate deliveryRate as percentage of the number delivered that were sent
            deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) / 100 : 0,
        },
    };
}
