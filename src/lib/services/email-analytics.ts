/**
 * @file src/lib/services/email-analytics.ts
 * Email analytics service module for fetching and aggregating email campaign data.
 * 
 * This service implements SOLID principles:
 * - Single Responsibility: Each function has one clear purpose
 * - Open/Closed: Extensible for new metric types and filters
 * - Interface Segregation: Focused interfaces for each data type
 * - Dependency Inversion: Abstracts database access
 */

import { prisma } from '@/lib/prisma';
import type { EmailCampaignDailyStats, EmailCampaign, EmailCampaignContent } from '../../../src/prisma/generated/client';

// Types for the service layer
export interface EmailMetricsAggregated {
  totalDeliveries: number;
  uniqueOpens: number;
  avgOpenRate: number;
  uniqueClicks: number;
  avgCTR: number;
  totalUnsubscribes: number;
  totalBounces: number;
}

export interface EmailCampaignWithStats {
  id: string;
  delivered: string;
  weekDay: string;
  subject: string;
  link: string;
  successfulDeliveries: number;
  opens: number;
  openRate: number;
  clicks: number;
  ctr: number;
  unsubscribes: number;
  bounces: number;
}

export interface EmailAnalyticsDateRange {
  start: Date;
  end: Date;
}

/**
 * Service class for email analytics operations
 */
export class EmailAnalyticsService {
  /**
   * Fetches and aggregates global email metrics from campaign daily stats
   */
  static async getGlobalMetrics(dateRange?: EmailAnalyticsDateRange): Promise<EmailMetricsAggregated> {
    const whereClause = dateRange ? {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      }
    } : {};

    const aggregatedData = await prisma.emailCampaignDailyStats.aggregate({
      where: whereClause,
      _sum: {
        delivered: true,
        uniqueOpens: true,
        uniqueClicks: true,
        unsubscribes: true,
        bounces: true,
        totalOpens: true,
      },
      _avg: {
        dailyUniqueOpenRate: true,
        dailyUniqueClickRate: true,
      }
    });

    const totalDeliveries = aggregatedData._sum.delivered || 0;
    const uniqueOpens = aggregatedData._sum.uniqueOpens || 0;
    const uniqueClicks = aggregatedData._sum.uniqueClicks || 0;

    return {
      totalDeliveries,
      uniqueOpens,
      avgOpenRate: totalDeliveries > 0 ? (uniqueOpens / totalDeliveries) * 100 : 0,
      uniqueClicks,
      avgCTR: uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0,
      totalUnsubscribes: aggregatedData._sum.unsubscribes || 0,
      totalBounces: aggregatedData._sum.bounces || 0,
    };
  }

  /**
   * Fetches campaign activity with related stats and content
   */
  static async getCampaignActivity(dateRange?: EmailAnalyticsDateRange): Promise<EmailCampaignWithStats[]> {
    const whereClause = dateRange ? {
      emailCampaignDailyStats: {
        some: {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          }
        }
      }
    } : {};

    const campaigns = await prisma.emailCampaign.findMany({
      where: whereClause,
      include: {
        emailCampaignContents: {
          orderBy: { sendTime: 'desc' },
          take: 1, // Get the most recent content
        },
        emailCampaignDailyStats: {
          where: dateRange ? {
            date: {
              gte: dateRange.start,
              lte: dateRange.end,
            }
          } : {},
          orderBy: { date: 'desc' },
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent campaigns
    });

    return campaigns.map(campaign => {
      // Aggregate stats for this campaign across the date range
      const stats = campaign.emailCampaignDailyStats.reduce(
        (acc, stat) => ({
          delivered: acc.delivered + stat.delivered,
          opens: acc.opens + stat.uniqueOpens,
          clicks: acc.clicks + stat.uniqueClicks,
          unsubscribes: acc.unsubscribes + stat.unsubscribes,
          bounces: acc.bounces + stat.bounces,
        }),
        { delivered: 0, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 }
      );

      const latestContent = campaign.emailCampaignContents[0];
      const sendDate = latestContent?.sendTime || campaign.createdAt;
      
      return {
        id: campaign.id,
        delivered: sendDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        weekDay: sendDate.toLocaleDateString('en-US', { weekday: 'long' }),
        subject: latestContent?.subject || campaign.campaignName,
        link: `https://campaign.link/${campaign.campaignId}`, // Placeholder URL structure
        successfulDeliveries: stats.delivered,
        opens: stats.opens,
        openRate: stats.delivered > 0 ? (stats.opens / stats.delivered) * 100 : 0,
        clicks: stats.clicks,
        ctr: stats.opens > 0 ? (stats.clicks / stats.opens) * 100 : 0,
        unsubscribes: stats.unsubscribes,
        bounces: stats.bounces,
      };
    });
  }

  /**
   * Gets default date range (last 30 days)
   */
  static getDefaultDateRange(): EmailAnalyticsDateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return { start, end };
  }

  /**
   * Validates and parses date range from query parameters
   */
  static parseDateRange(startDate?: string, endDate?: string): EmailAnalyticsDateRange | undefined {
    if (!startDate || !endDate) {
      return undefined;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return undefined;
    }

    return { start, end };
  }
} 