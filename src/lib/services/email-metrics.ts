/**
 * @file src/lib/services/email-metrics.ts
 * Shared utility functions for email metrics processing
 */

import { prisma } from '@/lib/prisma';
import { format, parseISO } from 'date-fns';

export interface EmailMetricsParams {
    emailClientId: string;
    userId: string;
    fromDate?: string | null;
    toDate?: string | null;
    selectedFrom?: string | null;
    selectedTo?: string | null;
}

export interface EmailMetricsResponse {
    emailClient: {
        id: string;
        clientName: string;
    };
    selectedRange: {
        from: string;
        to: string;
    };
    metrics: {
        current: EmailMetrics;
        previousYear: EmailMetrics;
        yearOverYear: YearOverYearChanges;
    };
    timeSeriesData: TimeSeriesDataPoint[];
    topCampaigns: ProcessedCampaignStat[];
    totalCampaigns: number;
}

interface EmailMetrics {
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    totalDelivered: number;
    totalRequests: number;
    averageOpenRate: number;
    averageClickRate: number;
}

interface YearOverYearChanges {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    openRate: number;
    clickRate: number;
}

interface TimeSeriesDataPoint {
    date: string;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    delivered: number;
    requests: number;
}

interface ProcessedCampaignStat {
    campaignId: string;
    campaignName: string;
    requests: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    unsubscribes: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
}

/**
 * Validates user access to an email client
 */
export async function validateEmailClientAccess(userId: string, emailClientId: string) {
    const userEmailClientAssociation = await prisma.userToEmailClient.findFirst({
        where: {
            userId: userId,
            emailClientId: emailClientId,
        },
        include: {
            emailClient: true,
        },
    });

    if (!userEmailClientAssociation) {
        return null;
    }

    return userEmailClientAssociation.emailClient;
}

/**
 * Parses and validates date parameters
 */
export function parseDateParams(params: EmailMetricsParams) {
    const from = params.fromDate ? parseISO(params.fromDate) : new Date();
    const to = params.toDate ? parseISO(params.toDate) : new Date();
    const selectedFromDate = params.selectedFrom ? parseISO(params.selectedFrom) : from;
    const selectedToDate = params.selectedTo ? parseISO(params.selectedTo) : to;

    return {
        from,
        to,
        selectedFromDate,
        selectedToDate,
    };
}

/**
 * Fetches email campaign daily stats from database
 */
export async function fetchEmailCampaignStats(emailClientId: string, from: Date, to: Date) {
    return await prisma.emailCampaignDailyStats.findMany({
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
}

interface EmailCampaignDailyStat {
    date: Date;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    delivered: number;
    requests: number;
    dailyTotalOpenRate?: number;
    dailyTotalClickRate?: number;
    uniqueOpens?: number;
    uniqueClicks?: number;
    emailCampaign: {
        campaignName: string;
        campaignId: string;
    };
}

/**
 * Filters stats for selected date range
 */
export function filterStatsForDateRange(stats: EmailCampaignDailyStat[], fromDate: Date, toDate: Date) {
    return stats.filter(stat => stat.date >= fromDate && stat.date <= toDate);
}

/**
 * Filters stats for previous year comparison
 */
export function filterStatsForPreviousYear(stats: EmailCampaignDailyStat[], selectedFromDate: Date, selectedToDate: Date) {
    return stats.filter(stat => {
        const statDate = new Date(stat.date);
        const previousYearDate = new Date(selectedFromDate);
        previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);
        const previousYearEndDate = new Date(selectedToDate);
        previousYearEndDate.setFullYear(previousYearEndDate.getFullYear() - 1);

        return statDate >= previousYearDate && statDate <= previousYearEndDate;
    });
}

/**
 * Calculates aggregated metrics from stats array
 */
export function calculateMetrics(stats: EmailCampaignDailyStat[]): EmailMetrics {
    return {
        totalOpens: stats.reduce((sum, stat) => sum + stat.opens, 0),
        totalClicks: stats.reduce((sum, stat) => sum + stat.clicks, 0),
        totalBounces: stats.reduce((sum, stat) => sum + stat.bounces, 0),
        totalUnsubscribes: stats.reduce((sum, stat) => sum + stat.unsubscribes, 0),
        totalDelivered: stats.reduce((sum, stat) => sum + stat.delivered, 0),
        totalRequests: stats.reduce((sum, stat) => sum + stat.requests, 0),
        averageOpenRate: stats.length > 0
            ? stats.reduce((sum, stat) => sum + (stat.dailyTotalOpenRate || 0), 0) / stats.length / 100
            : 0,
        averageClickRate: stats.length > 0
            ? stats.reduce((sum, stat) => sum + (stat.dailyTotalClickRate || 0), 0) / stats.length / 100
            : 0,
    };
}

/**
 * Calculates year-over-year changes
 */
export function calculateYearOverYearChanges(current: EmailMetrics, previous: EmailMetrics): YearOverYearChanges {
    return {
        opens: previous.totalOpens > 0
            ? ((current.totalOpens - previous.totalOpens) / previous.totalOpens) * 100
            : 0,
        clicks: previous.totalClicks > 0
            ? ((current.totalClicks - previous.totalClicks) / previous.totalClicks) * 100
            : 0,
        bounces: previous.totalBounces > 0
            ? ((current.totalBounces - previous.totalBounces) / previous.totalBounces) * 100
            : 0,
        unsubscribes: previous.totalUnsubscribes > 0
            ? ((current.totalUnsubscribes - previous.totalUnsubscribes) / previous.totalUnsubscribes) * 100
            : 0,
        openRate: previous.averageOpenRate > 0
            ? ((current.averageOpenRate - previous.averageOpenRate) / previous.averageOpenRate) * 100
            : 0,
        clickRate: previous.averageClickRate > 0
            ? ((current.averageClickRate - previous.averageClickRate) / previous.averageClickRate) * 100
            : 0,
    };
}

/**
 * Processes stats into time series data
 */
export function processTimeSeriesData(stats: EmailCampaignDailyStat[]): TimeSeriesDataPoint[] {
    const dailyData = stats.reduce((acc, stat) => {
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
    }, {} as Record<string, TimeSeriesDataPoint>);

    return Object.values(dailyData).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

interface CampaignStatsAccumulator {
    campaignId: string;
    campaignName: string;
    requests: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    unsubscribes: number;
    opens: number;
    clicks: number;
    dates: Set<string>;
    dailyUniques: { date: string; uniqueOpens: number; uniqueClicks: number }[];
}

/**
 * Processes campaign statistics
 */
export function processCampaignStats(stats: EmailCampaignDailyStat[]): ProcessedCampaignStat[] {
    const campaignStats = stats.reduce((acc, stat) => {
        const campaignKey = stat.emailCampaign.campaignId;
        if (!acc[campaignKey]) {
            acc[campaignKey] = {
                campaignId: campaignKey,
                campaignName: stat.emailCampaign.campaignName,
                requests: 0,
                delivered: 0,
                uniqueOpens: 0,
                uniqueClicks: 0,
                unsubscribes: 0,
                opens: 0,
                clicks: 0,
                // Track dates to avoid double counting uniques
                dates: new Set<string>(),
                dailyUniques: [] as { date: string; uniqueOpens: number; uniqueClicks: number }[],
            };
        }

        const dateKey = format(new Date(stat.date), 'yyyy-MM-dd');
        if (!acc[campaignKey].dates.has(dateKey)) {
            acc[campaignKey].dates.add(dateKey);
            acc[campaignKey].dailyUniques.push({
                date: dateKey,
                uniqueOpens: stat.uniqueOpens || 0,
                uniqueClicks: stat.uniqueClicks || 0,
            });
        }

        acc[campaignKey].requests += stat.requests || 0;
        acc[campaignKey].delivered += stat.delivered || 0;
        acc[campaignKey].unsubscribes += stat.unsubscribes || 0;
        acc[campaignKey].opens += stat.opens || 0;
        acc[campaignKey].clicks += stat.clicks || 0;
        return acc;
    }, {} as Record<string, CampaignStatsAccumulator>);

    // Process campaign stats to calculate proper unique metrics
    const processedCampaignStats = Object.values(campaignStats).map(campaign => {
        // Take the maximum unique values across days as the campaign total
        const uniqueOpens = Math.max(...campaign.dailyUniques.map(day => day.uniqueOpens));
        const uniqueClicks = Math.max(...campaign.dailyUniques.map(day => day.uniqueClicks));

        // Clean up temporary tracking fields
        const { dates, dailyUniques, ...cleanCampaign } = campaign;

        return {
            ...cleanCampaign,
            uniqueOpens,
            uniqueClicks,
            // Calculate rates based on delivered emails
            openRate: campaign.delivered > 0 ? (uniqueOpens / campaign.delivered) * 100 : 0,
            clickRate: campaign.delivered > 0 ? (uniqueClicks / campaign.delivered) * 100 : 0,
            deliveryRate: campaign.requests > 0 ? (campaign.delivered / campaign.requests) * 100 : 0,
        };
    });

    return processedCampaignStats
        .sort((a, b) => b.uniqueOpens - a.uniqueOpens)
        .slice(0, 5);
}

/**
 * Main function to get email metrics
 */
export async function getEmailMetrics(params: EmailMetricsParams): Promise<EmailMetricsResponse> {
    // Validate email client access
    const emailClient = await validateEmailClientAccess(params.userId, params.emailClientId);
    if (!emailClient) {
        throw new Error('Email Client not found or not accessible');
    }

    // Parse date parameters
    const { from, to, selectedFromDate, selectedToDate } = parseDateParams(params);

    // Fetch email campaign daily stats
    const emailCampaignDailyStats = await fetchEmailCampaignStats(params.emailClientId, from, to);

    // Filter stats for different time periods
    const selectedRangeStats = filterStatsForDateRange(emailCampaignDailyStats, selectedFromDate, selectedToDate);
    const previousYearStats = filterStatsForPreviousYear(emailCampaignDailyStats, selectedFromDate, selectedToDate);

    // Calculate metrics
    const selectedRangeMetrics = calculateMetrics(selectedRangeStats);
    const previousYearMetrics = calculateMetrics(previousYearStats);
    const yearOverYearChanges = calculateYearOverYearChanges(selectedRangeMetrics, previousYearMetrics);

    // Process time series and campaign data
    const timeSeriesData = processTimeSeriesData(emailCampaignDailyStats);
    const topCampaigns = processCampaignStats(emailCampaignDailyStats);

    return {
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
        totalCampaigns: new Set(emailCampaignDailyStats.map(stat => stat.emailCampaign.campaignId)).size,
    };
}
