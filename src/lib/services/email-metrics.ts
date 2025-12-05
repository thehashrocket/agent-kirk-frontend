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
    campaignNameFilter?: string | null; // <-- Add this line
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
    };
    topCampaigns: ProcessedCampaignStat[];
    totalCampaigns: number;
}

interface EmailMetrics {
    totalOpens: number;
    totalUniqueOpens: number;
    totalClicks: number;
    totalUniqueClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    totalSpamReports: number;
    totalDelivered: number;
    totalRequests: number;
    averageOpenRate: number;
    averageUniqueOpenRate: number;
    averageClickRate: number;
    averageUniqueClickRate: number;
    averageDeliveryRate: number;
    averageBounceRate: number;
    averageUnsubscribeRate: number;
    averageSpamReportRate: number;
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
    sent: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    unsubscribes: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
    sendTime?: string | null;
    subject?: string | null;
}

export interface EmailCampaignDetail {
    campaignId: string;
    campaignName: string;
    subject: string | null;
    sendTime: string | null;
    requests: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    bounces: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
}

export type EmailMetricRow = {
    campaignId: string;
    campaignName: string;
    subject: string | null;
    sendTime: Date | null;
    sent: number;
    delivered: number;
    opens: number;
    uniqueOpens: number;
    clicks: number;
    uniqueClicks: number;
    unsubscribes: number;
    bounces: number;
    spamReports: number;
};

export async function fetchCampaignMetricsWithinSendWindow(emailClientId: string, from: Date, to: Date): Promise<EmailMetricRow[]> {
    // Step 1: select the campaigns that actually sent within the requested window.
    const campaigns = await prisma.emailCampaign.findMany({
        where: {
            emailClientId,
            emailCampaignContent: {
                sendTime: {
                    gte: from,
                    lte: to,
                },
            },
        },
        select: {
            campaignId: true,
            campaignName: true,
            emailCampaignContent: {
                select: {
                    subject: true,
                    sendTime: true,
                },
            },
        },
    });

    if (campaigns.length === 0) {
        return [];
    }

    const campaignIds = campaigns.map(campaign => campaign.campaignId);

    // Step 2: aggregate every stats row for the selected campaigns (no date filter on stats).
    const stats = await prisma.emailCampaignDailyStats.groupBy({
        by: ['emailCampaignId'],
        where: {
            emailClientId,
            emailCampaignId: {
                in: campaignIds,
            },
        },
        _sum: {
            requests: true,
            delivered: true,
            opens: true,
            uniqueOpens: true,
            clicks: true,
            uniqueClicks: true,
            unsubscribes: true,
            bounces: true,
            spamReports: true,
        },
    });

    const statsByCampaign = stats.reduce<Record<string, Omit<EmailMetricRow, 'campaignId' | 'campaignName' | 'subject' | 'sendTime'>>>((acc, stat) => {
        acc[stat.emailCampaignId] = {
            sent: stat._sum.requests ?? 0,
            delivered: stat._sum.delivered ?? 0,
            opens: stat._sum.opens ?? 0,
            uniqueOpens: stat._sum.uniqueOpens ?? 0,
            clicks: stat._sum.clicks ?? 0,
            uniqueClicks: stat._sum.uniqueClicks ?? 0,
            unsubscribes: stat._sum.unsubscribes ?? 0,
            bounces: stat._sum.bounces ?? 0,
            spamReports: stat._sum.spamReports ?? 0,
        };
        return acc;
    }, {});

    // Step 3: merge aggregated stats with campaign metadata to build the final per-campaign rows.
    return campaigns
        .flatMap(campaign => {
            const sums = statsByCampaign[campaign.campaignId] ?? {
                sent: 0,
                delivered: 0,
                opens: 0,
                uniqueOpens: 0,
                clicks: 0,
                uniqueClicks: 0,
                unsubscribes: 0,
                bounces: 0,
                spamReports: 0,
            };

            const subject = campaign.emailCampaignContent?.subject ?? null;
            const sendTime = campaign.emailCampaignContent?.sendTime ?? null;

            if (!sendTime) {
                // Skip campaigns that do not have a recorded send time.
                return [];
            }

            return [{
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                subject,
                sendTime,
                ...sums,
            }];
        });
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
    // console.log('Parsing date params:', params);
    const from = params.fromDate ? parseISO(params.fromDate) : new Date();
    const to = params.toDate ? parseISO(params.toDate) : new Date();

    // Optionally, set 'to' to end of day for inclusivity
    to.setHours(23, 59, 59, 999);

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
    // console.log('Fetching email campaign stats for:', emailClientId, from, to);
    const stats = await prisma.emailCampaignDailyStats.findMany({
        where: {
            emailClientId: emailClientId,
            date: {
                gte: from,
                lte: to,
            },
        },
        include: {
            EmailCampaign: {
                select: {
                    campaignName: true,
                    campaignId: true,
                    emailCampaignContent: {
                        select: { subject: true, sendTime: true }
                    }
                }
            }
        },
        orderBy: {
            date: 'asc',
        },
    });

    return stats.map(stat => ({
        ...stat,
        emailCampaign: stat.EmailCampaign
    }));
}

interface EmailCampaignDailyStat {
    date: Date;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
    spamReports?: number;
    delivered: number;
    requests: number;
    dailyTotalOpenRate?: number;
    dailyTotalClickRate?: number;
    uniqueOpens?: number;
    uniqueClicks?: number;
    emailCampaign: {
        campaignName: string;
        campaignId: string;
        emailCampaignContent: { subject: string; sendTime: Date | string | null } | null;
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
    const totalOpens = stats.reduce((sum, stat) => sum + stat.opens, 0);
    const totalUniqueOpens = stats.reduce((sum, stat) => sum + (stat.uniqueOpens || 0), 0);
    const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
    const totalUniqueClicks = stats.reduce((sum, stat) => sum + (stat.uniqueClicks || 0), 0);
    const totalBounces = stats.reduce((sum, stat) => sum + stat.bounces, 0);
    const totalUnsubscribes = stats.reduce((sum, stat) => sum + stat.unsubscribes, 0);
    const totalSpamReports = stats.reduce((sum, stat) => sum + (stat.spamReports || 0), 0);
    const totalDelivered = stats.reduce((sum, stat) => sum + stat.delivered, 0);
    const totalRequests = stats.reduce((sum, stat) => sum + stat.requests, 0);

    return {
        totalOpens,
        totalUniqueOpens,
        totalClicks,
        totalUniqueClicks,
        totalBounces,
        totalUnsubscribes,
        totalSpamReports,
        totalDelivered,
        totalRequests,
        averageOpenRate: totalDelivered > 0 ? totalOpens / totalDelivered : 0,
        averageUniqueOpenRate: totalDelivered > 0 ? totalUniqueOpens / totalDelivered : 0,
        averageClickRate: totalDelivered > 0 ? totalClicks / totalDelivered : 0,
        averageUniqueClickRate: totalDelivered > 0 ? totalUniqueClicks / totalDelivered : 0,
        averageDeliveryRate: totalRequests > 0 ? totalDelivered / totalRequests : 0,
        averageBounceRate: totalDelivered > 0 ? totalBounces / totalDelivered : 0,
        averageUnsubscribeRate: totalDelivered > 0 ? totalUnsubscribes / totalDelivered : 0,
        averageSpamReportRate: totalDelivered > 0 ? totalSpamReports / totalDelivered : 0,
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

interface CampaignStatsAccumulator {
    campaignId: string;
    campaignName: string;
    clicks: number;
    dailyUniques: { date: string; uniqueOpens: number; uniqueClicks: number }[];
    dates: Set<string>;
    delivered: number;
    opens: number;
    requests: number;
    subject?: string | null;
    uniqueClicks: number;
    uniqueOpens: number;
    unsubscribes: number;
    sendTime?: string | null;
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

    // Fetch daily stats for the selected period (Activity-based)
    const dailyStats = await fetchEmailCampaignStats(params.emailClientId, from, to);

    // Calculate total metrics for the period
    const selectedRangeMetrics = calculateMetrics(dailyStats);

    // Aggregate daily stats by campaign for the "Top Campaigns" list
    const campaignStatsMap = new Map<string, EmailMetricRow>();

    for (const stat of dailyStats) {
        const campaignId = stat.emailCampaign.campaignId;

        if (!campaignStatsMap.has(campaignId)) {
            campaignStatsMap.set(campaignId, {
                campaignId: campaignId,
                campaignName: stat.emailCampaign.campaignName,
                subject: stat.emailCampaign.emailCampaignContent?.subject ?? null,
                sendTime: stat.emailCampaign.emailCampaignContent?.sendTime ? new Date(stat.emailCampaign.emailCampaignContent.sendTime) : null,
                sent: 0,
                delivered: 0,
                opens: 0,
                uniqueOpens: 0,
                clicks: 0,
                uniqueClicks: 0,
                unsubscribes: 0,
                bounces: 0,
                spamReports: 0,
            });
        }

        const row = campaignStatsMap.get(campaignId)!;
        row.sent += stat.requests;
        row.delivered += stat.delivered;
        row.opens += stat.opens;
        row.uniqueOpens += (stat.uniqueOpens || 0);
        row.clicks += stat.clicks;
        row.uniqueClicks += (stat.uniqueClicks || 0);
        row.unsubscribes += stat.unsubscribes;
        row.bounces += stat.bounces;
        row.spamReports += (stat.spamReports || 0);
    }

    let campaignMetricRows = Array.from(campaignStatsMap.values());

    if (params.campaignNameFilter && params.campaignNameFilter.trim() !== '') {
        const filterValue = params.campaignNameFilter.trim().toLowerCase();
        campaignMetricRows = campaignMetricRows.filter(row =>
            row.campaignName.toLowerCase().includes(filterValue)
        );
    }

    // Step 4: convert the aggregated rows into the response shape expected by the UI.
    const topCampaigns: ProcessedCampaignStat[] = campaignMetricRows
        .map(row => ({
            campaignId: row.campaignId,
            campaignName: row.campaignName,
            subject: row.subject,
            requests: row.sent,
            sent: row.sent,
            delivered: row.delivered,
            uniqueOpens: row.uniqueOpens,
            uniqueClicks: row.uniqueClicks,
            unsubscribes: row.unsubscribes,
            opens: row.opens,
            clicks: row.clicks,
            openRate: row.delivered > 0 ? (row.uniqueOpens / row.delivered) * 100 : 0,
            clickRate: row.delivered > 0 ? (row.uniqueClicks / row.delivered) * 100 : 0,
            deliveryRate: row.sent > 0 ? (row.delivered / row.sent) * 100 : 0,
            sendTime: row.sendTime ? row.sendTime.toISOString() : null,
        }))
        .sort((a, b) => {
            // Primary sort: Requests (descending)
            if (b.requests !== a.requests) {
                return b.requests - a.requests;
            }
            // Secondary sort: Send Time (descending)
            const timeA = a.sendTime ? new Date(a.sendTime).getTime() : 0;
            const timeB = b.sendTime ? new Date(b.sendTime).getTime() : 0;
            return timeB - timeA;
        });

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
            current: selectedRangeMetrics
        },
        topCampaigns,
        totalCampaigns: campaignMetricRows.length,
    };
}

interface EmailCampaignDetailParams {
    userId: string;
    emailClientId: string;
    campaignId: string;
}

export async function getEmailCampaignDetail(params: EmailCampaignDetailParams): Promise<EmailCampaignDetail> {
    const { userId, emailClientId, campaignId } = params;

    const emailClient = await validateEmailClientAccess(userId, emailClientId);
    if (!emailClient) {
        throw new Error('Email Client not found or not accessible');
    }

    const campaign = await prisma.emailCampaign.findFirst({
        where: {
            campaignId,
            emailClientId,
        },
        include: {
            emailCampaignContent: {
                select: {
                    subject: true,
                    sendTime: true,
                }
            },
            emailCampaignDailyStats: true,
        },
    });

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    const aggregates = campaign.emailCampaignDailyStats.reduce(
        (acc, stat) => {
            acc.requests += stat.requests || 0;
            acc.delivered += stat.delivered || 0;
            acc.opens += stat.opens || 0;
            acc.clicks += stat.clicks || 0;
            acc.unsubscribes += stat.unsubscribes || 0;
            acc.bounces += stat.bounces || 0;
            acc.uniqueOpens.push(stat.uniqueOpens || 0);
            acc.uniqueClicks.push(stat.uniqueClicks || 0);
            return acc;
        },
        {
            requests: 0,
            delivered: 0,
            opens: 0,
            clicks: 0,
            unsubscribes: 0,
            bounces: 0,
            uniqueOpens: [] as number[],
            uniqueClicks: [] as number[],
        }
    );

    const uniqueOpens =
        aggregates.uniqueOpens.length > 0
            ? Math.max(...aggregates.uniqueOpens)
            : 0;
    const uniqueClicks =
        aggregates.uniqueClicks.length > 0
            ? Math.max(...aggregates.uniqueClicks)
            : 0;

    const deliveryRate = aggregates.requests > 0 ? (aggregates.delivered / aggregates.requests) * 100 : 0;
    const openRate = aggregates.delivered > 0 ? (uniqueOpens / aggregates.delivered) * 100 : 0;
    const clickRate = aggregates.delivered > 0 ? (uniqueClicks / aggregates.delivered) * 100 : 0;

    const sendTime = campaign.emailCampaignContent?.sendTime
        ? campaign.emailCampaignContent.sendTime.toISOString()
        : null;

    return {
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        subject: campaign.emailCampaignContent?.subject || campaign.campaignName,
        sendTime,
        requests: aggregates.requests,
        delivered: aggregates.delivered,
        opens: aggregates.opens,
        clicks: aggregates.clicks,
        uniqueOpens,
        uniqueClicks,
        unsubscribes: aggregates.unsubscribes,
        bounces: aggregates.bounces,
        deliveryRate,
        openRate,
        clickRate,
    };
}
