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
};

export async function fetchCampaignMetricsWithinSendWindow(emailClientId: string, from: Date, to: Date): Promise<EmailMetricRow[]> {
    // Step 1: select the campaigns that actually sent within the requested window.
    const campaigns = await prisma.emailCampaign.findMany({
        where: {
            emailClientId,
            emailCampaignContents: {
                sendTime: {
                    gte: from,
                    lte: to,
                },
            },
        },
        select: {
            campaignId: true,
            campaignName: true,
            emailCampaignContents: {
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
            };

            const subject = campaign.emailCampaignContents?.subject ?? null;
            const sendTime = campaign.emailCampaignContents?.sendTime ?? null;

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
    // to.setHours(23, 59, 59, 999);

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
                    emailCampaignContents: {
                        select: { subject: true, sendTime: true }
                    }
                }
            }
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
        emailCampaignContents: { subject: string; sendTime: Date | string | null }[];
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
    const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
    const totalBounces = stats.reduce((sum, stat) => sum + stat.bounces, 0);
    const totalUnsubscribes = stats.reduce((sum, stat) => sum + stat.unsubscribes, 0);
    const totalDelivered = stats.reduce((sum, stat) => sum + stat.delivered, 0);
    const totalRequests = stats.reduce((sum, stat) => sum + stat.requests, 0);

    return {
        totalOpens,
        totalClicks,
        totalBounces,
        totalUnsubscribes,
        totalDelivered,
        totalRequests,
        averageOpenRate: totalDelivered > 0 ? totalOpens / totalDelivered : 0,
        averageClickRate: totalDelivered > 0 ? totalClicks / totalDelivered : 0,
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
 * Processes campaign statistics
 * This code is deprecated and will be removed in the future.
 */
// export function processCampaignStats(stats: EmailCampaignDailyStat[]): ProcessedCampaignStat[] {
//     const campaignStats = stats.reduce((acc, stat) => {
//         const campaignKey = stat.emailCampaign.campaignId;
//         if (!acc[campaignKey]) {
//             acc[campaignKey] = {
//                 campaignId: campaignKey,
//                 campaignName: stat.emailCampaign.campaignName,
//                 requests: 0,
//                 delivered: 0,
//                 uniqueOpens: 0,
//                 uniqueClicks: 0,
//                 unsubscribes: 0,
//                 opens: 0,
//                 clicks: 0,
//                 // Track dates to avoid double counting uniques
//                 dates: new Set<string>(),
//                 dailyUniques: [] as { date: string; uniqueOpens: number; uniqueClicks: number }[],
//                 sendTime: null,
//             };
//         }

//         const dateKey = format(new Date(stat.date), 'yyyy-MM-dd');
//         if (!acc[campaignKey].dates.has(dateKey)) {
//             acc[campaignKey].dates.add(dateKey);
//             acc[campaignKey].dailyUniques.push({
//                 date: dateKey,
//                 uniqueOpens: stat.uniqueOpens || 0,
//                 uniqueClicks: stat.uniqueClicks || 0,
//             });
//         }

//         acc[campaignKey].requests += stat.requests || 0;
//         acc[campaignKey].delivered += stat.delivered || 0;
//         acc[campaignKey].unsubscribes += stat.unsubscribes || 0;
//         acc[campaignKey].opens += stat.opens || 0;
//         acc[campaignKey].clicks += stat.clicks || 0;
//         const hasContentArray = Array.isArray(stat.emailCampaign.emailCampaignContents) && stat.emailCampaign.emailCampaignContents.length > 0;
//         const primaryContent = hasContentArray ? stat.emailCampaign.emailCampaignContents[0] : undefined;
//         acc[campaignKey].subject = primaryContent?.subject ?? acc[campaignKey].subject;

//         const candidateSendDate = primaryContent?.sendTime
//             ? new Date(primaryContent.sendTime)
//             : stat.date
//                 ? new Date(stat.date)
//                 : undefined;

//         if (candidateSendDate) {
//             const existingSendTime = acc[campaignKey].sendTime ? new Date(acc[campaignKey].sendTime) : null;
//             if (!existingSendTime || candidateSendDate < existingSendTime) {
//                 acc[campaignKey].sendTime = candidateSendDate.toISOString();
//             }
//         }

//         return acc;
//     }, {} as Record<string, CampaignStatsAccumulator>);

//     // Process campaign stats to calculate proper unique metrics
//     const processedCampaignStats = Object.values(campaignStats).map(campaign => {
//         // Take the maximum unique values across days as the campaign total
//         const uniqueOpens = Math.max(...campaign.dailyUniques.map(day => day.uniqueOpens));
//         const uniqueClicks = Math.max(...campaign.dailyUniques.map(day => day.uniqueClicks));

//         // Clean up temporary tracking fields
//         const { dates, dailyUniques, ...cleanCampaign } = campaign;

//         return {
//             ...cleanCampaign,
//             sent: cleanCampaign.requests,
//             uniqueOpens,
//             uniqueClicks,
//             // Calculate rates based on delivered emails
//             openRate: campaign.delivered > 0 ? (uniqueOpens / campaign.delivered) * 100 : 0,
//             clickRate: campaign.delivered > 0 ? (uniqueClicks / campaign.delivered) * 100 : 0,
//             deliveryRate: campaign.requests > 0 ? (campaign.delivered / campaign.requests) * 100 : 0,
//         };
//     });

//     return processedCampaignStats
//         .sort((a, b) => b.uniqueOpens - a.uniqueOpens)
//     // No longer limiting to top 5 campaigns
//     // .slice(0, 5);
// }

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

    const campaignMetricRows = await fetchCampaignMetricsWithinSendWindow(params.emailClientId, from, to);

    const totals = campaignMetricRows.reduce(
        (acc, row) => {
            acc.opens += row.opens;
            acc.clicks += row.clicks;
            acc.bounces += row.bounces;
            acc.unsubscribes += row.unsubscribes;
            acc.delivered += row.delivered;
            acc.sent += row.sent;
            return acc;
        },
        {
            opens: 0,
            clicks: 0,
            bounces: 0,
            unsubscribes: 0,
            delivered: 0,
            sent: 0,
        }
    );

    const selectedRangeMetrics: EmailMetrics = {
        totalOpens: totals.opens,
        totalClicks: totals.clicks,
        totalBounces: totals.bounces,
        totalUnsubscribes: totals.unsubscribes,
        totalDelivered: totals.delivered,
        totalRequests: totals.sent,
        averageOpenRate: totals.delivered > 0 ? totals.opens / totals.delivered : 0,
        averageClickRate: totals.delivered > 0 ? totals.clicks / totals.delivered : 0,
    };

    let filteredCampaignRows = campaignMetricRows;
    if (params.campaignNameFilter && params.campaignNameFilter.trim() !== '') {
        const filterValue = params.campaignNameFilter.trim().toLowerCase();
        filteredCampaignRows = campaignMetricRows.filter(row =>
            row.campaignName.toLowerCase().includes(filterValue)
        );
    }

    // Step 4: convert the aggregated rows into the response shape expected by the UI.
    const topCampaigns: ProcessedCampaignStat[] = filteredCampaignRows
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
        .sort((a, b) => b.uniqueOpens - a.uniqueOpens);

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
            emailCampaignContents: {
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

    const sendTime = campaign.emailCampaignContents?.sendTime
        ? campaign.emailCampaignContents.sendTime.toISOString()
        : null;

    return {
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        subject: campaign.emailCampaignContents?.subject || campaign.campaignName,
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
