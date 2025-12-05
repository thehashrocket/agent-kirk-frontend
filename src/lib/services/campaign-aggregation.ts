/**
 * @file src/lib/services/campaign-aggregation.ts
 * Service for aggregating campaign data from Email and USPS sources
 */

import { prisma } from '@/lib/prisma';
import { getEmailMetrics, EmailMetricsParams } from './email-metrics';
import { getDirectMailMetrics, DirectMailMetricsParams } from './direct-mail-metrics';

export interface CampaignAggregationParams {
    userId: string;
    emailClientId: string;
    uspsClientId: string;
    fromDate?: string;
    toDate?: string;
}

export interface AggregatedCampaignData {
    campaignName: string;
    // Email Metrics
    emailsSent: number;
    emailClicks: number;
    emailClickThroughRate: number;
    // USPS Metrics
    uspsPiecesSent: number;
    uspsDelivered: number;
    uspsUndelivered: number;
    // USPS Timeframe
    uspsSentDate: string | null;
    uspsReceivedByPostOfficeDate: string | null;
    uspsDeliveredToHomesDate: string | null;
    // Conversion
    conversionRate: number;
}

export async function getCampaignAggregationMetrics(params: CampaignAggregationParams): Promise<AggregatedCampaignData[]> {
    const { userId, emailClientId, uspsClientId, fromDate, toDate } = params;

    // 1. Fetch Email Metrics
    const emailParams: EmailMetricsParams = {
        userId,
        emailClientId,
        fromDate,
        toDate,
    };

    // We get all campaigns within the window
    const emailMetricsResponse = await getEmailMetrics(emailParams);
    const emailCampaigns = emailMetricsResponse.topCampaigns;

    // 2. Fetch USPS Metrics
    const uspsParams: DirectMailMetricsParams = {
        userId,
        accountId: uspsClientId,
        fromDate,
        toDate,
    };

    const uspsMetricsResponse = await getDirectMailMetrics(uspsParams);
    const uspsCampaigns = uspsMetricsResponse.tableData;

    // 3. Aggregate Data by Campaign Name
    // We'll use a map to merge data. Key is campaignName (normalized to lowercase for better matching?)
    // The requirement says "use the campaignName ... to join the data together". 
    // Let's assume exact match or case-insensitive match. I'll use case-insensitive for robustness.

    const aggregationMap = new Map<string, AggregatedCampaignData>();

    // Process Email Campaigns
    for (const emailCamp of emailCampaigns) {
        const key = emailCamp.campaignName.toLowerCase();

        // Existing entry?
        let entry = aggregationMap.get(key);
        if (!entry) {
            entry = createEmptyAggregation(emailCamp.campaignName);
            aggregationMap.set(key, entry);
        }

        // Update Email Data
        entry.emailsSent += emailCamp.sent;
        entry.emailClicks += emailCamp.uniqueClicks; // Using unique clicks for CTR usually
        // Recalculate CTR
        entry.emailClickThroughRate = entry.emailsSent > 0
            ? (entry.emailClicks / entry.emailsSent) * 100
            : 0;
    }

    // Process USPS Campaigns
    for (const uspsCamp of uspsCampaigns) {
        const key = uspsCamp.campaignName.toLowerCase();

        let entry = aggregationMap.get(key);
        if (!entry) {
            entry = createEmptyAggregation(uspsCamp.campaignName);
            aggregationMap.set(key, entry);
        }

        // Update USPS Data
        entry.uspsPiecesSent += uspsCamp.pieces;
        entry.uspsDelivered += uspsCamp.delivered;
        entry.uspsUndelivered = entry.uspsPiecesSent - entry.uspsDelivered;

        // Timeframes
        // uspsCamp.sendDate is "Sent to us" (based on direct-mail-metrics.ts mapping)
        entry.uspsSentDate = uspsCamp.sendDate;

        // For "Received by post office" and "Delivered to homes", direct-mail-metrics.ts 
        // doesn't explicitly export these dates in tableData, but it has `lastScanDate`.
        // `UspsCampaignSummary` has `mailDate` and `scanDate`.
        // `direct-mail-metrics.ts` maps:
        // - sendDate -> campaign.sendDate
        // - lastScanDate -> latestSummary.scanDate
        // It seems we might need to fetch more data or rely on what's available.
        // The `tableData` in `DirectMailMetricsResponse` has `lastScanDate`.
        // But `mailDate` (Received by PO?) is not in `tableData`.
        // I might need to modify `direct-mail-metrics.ts` or fetch raw data here.
        // However, `getDirectMailMetrics` returns `tableData`.
        // Let's look at `direct-mail-metrics.ts` again.
        // It selects `uspsCampaignSummary` and maps `lastScanDate`.
        // It does NOT return `mailDate`.

        // For now, I will map:
        // a. When sent to us -> uspsCamp.sendDate
        // b. When received by the post office -> Not available in `tableData`. I'll leave as null for now or check if I can modify the other service.
        // c. When delivered to homes -> uspsCamp.lastScanDate (approximate, as it's the last scan)

        entry.uspsDeliveredToHomesDate = uspsCamp.lastScanDate;
    }

    return Array.from(aggregationMap.values());
}

function createEmptyAggregation(campaignName: string): AggregatedCampaignData {
    return {
        campaignName,
        emailsSent: 0,
        emailClicks: 0,
        emailClickThroughRate: 0,
        uspsPiecesSent: 0,
        uspsDelivered: 0,
        uspsUndelivered: 0,
        uspsSentDate: null,
        uspsReceivedByPostOfficeDate: null,
        uspsDeliveredToHomesDate: null,
        conversionRate: 0,
    };
}
