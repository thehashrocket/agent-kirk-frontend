/**
 * @file src/lib/account-rep.ts
 * Account Representative utility functions for fetching dashboard statistics
 */

import { prisma, type ClientSatisfaction } from './prisma';
import { cache } from 'react';
import { subDays } from 'date-fns';

interface HistoricalStats {
  current: number;
  previous: number;
  percentageChange: number;
}

/**
 * Calculate percentage change between two numbers
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
}

/**
 * Get count of active clients for an account representative
 */
export const getActiveClients = cache(async (accountRepId: string) => {
  try {
    const count = await prisma.user.count({
      where: {
        accountRepId,
        isActive: true,
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching active clients:', error);
    throw new Error('Failed to fetch active clients');
  }
});

/**
 * Get count of unread messages (open tickets) for an account representative
 */
export const getUnreadMessages = cache(async (accountRepId: string) => {
  try {
    const count = await prisma.message.count({
      where: {
        recipientId: accountRepId,
        isRead: false,
        archived: false,
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    throw new Error('Failed to fetch unread messages');
  }
});

/**
 * Calculate response rate for an account representative
 * Based on messages responded to within 24 hours
 */
export const getResponseRate = cache(async (accountRepId: string) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all messages received in last 24 hours
    const totalMessages = await prisma.message.count({
      where: {
        recipientId: accountRepId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // Get messages that were read within 24 hours
    const respondedMessages = await prisma.message.count({
      where: {
        recipientId: accountRepId,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        isRead: true,
      },
    });

    if (totalMessages === 0) return 100; // If no messages, return 100% response rate
    return Math.round((respondedMessages / totalMessages) * 100);
  } catch (error) {
    console.error('Error calculating response rate:', error);
    throw new Error('Failed to calculate response rate');
  }
});

/**
 * Get historical stats for active clients
 */
export const getActiveClientsStats = cache(async (accountRepId: string): Promise<HistoricalStats> => {
  try {
    const [currentCount, previousCount] = await Promise.all([
      // Current active clients
      prisma.user.count({
        where: {
          accountRepId,
          isActive: true,
        },
      }),
      // Active clients from 30 days ago
      prisma.user.count({
        where: {
          accountRepId,
          isActive: true,
          createdAt: {
            lt: subDays(new Date(), 30),
          },
        },
      }),
    ]);

    return {
      current: currentCount,
      previous: previousCount,
      percentageChange: calculatePercentageChange(currentCount, previousCount),
    };
  } catch (error) {
    console.error('Error fetching active clients stats:', error);
    throw new Error('Failed to fetch active clients stats');
  }
});

/**
 * Get historical stats for unread messages
 */
export const getUnreadMessagesStats = cache(async (accountRepId: string): Promise<HistoricalStats> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [currentCount, previousCount] = await Promise.all([
      // Current unread messages
      prisma.message.count({
        where: {
          recipientId: accountRepId,
          isRead: false,
          archived: false,
        },
      }),
      // Unread messages from 30 days ago
      prisma.message.count({
        where: {
          recipientId: accountRepId,
          isRead: false,
          archived: false,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      current: currentCount,
      previous: previousCount,
      percentageChange: calculatePercentageChange(currentCount, previousCount),
    };
  } catch (error) {
    console.error('Error fetching unread messages stats:', error);
    throw new Error('Failed to fetch unread messages stats');
  }
});

/**
 * Get historical response rate stats
 */
export const getResponseRateStats = cache(async (accountRepId: string): Promise<HistoricalStats> => {
  try {
    const [currentRate, previousRate] = await Promise.all([
      // Current response rate (last 24 hours)
      (async () => {
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const [total, responded] = await Promise.all([
          prisma.message.count({
            where: {
              recipientId: accountRepId,
              createdAt: { gte: twentyFourHoursAgo },
            },
          }),
          prisma.message.count({
            where: {
              recipientId: accountRepId,
              createdAt: { gte: twentyFourHoursAgo },
              isRead: true,
            },
          }),
        ]);
        return total === 0 ? 100 : Math.round((responded / total) * 100);
      })(),
      // Previous response rate (24-48 hours ago)
      (async () => {
        const fortyEightHoursAgo = subDays(new Date(), 2);
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const [total, responded] = await Promise.all([
          prisma.message.count({
            where: {
              recipientId: accountRepId,
              createdAt: {
                gte: fortyEightHoursAgo,
                lt: twentyFourHoursAgo,
              },
            },
          }),
          prisma.message.count({
            where: {
              recipientId: accountRepId,
              createdAt: {
                gte: fortyEightHoursAgo,
                lt: twentyFourHoursAgo,
              },
              isRead: true,
            },
          }),
        ]);
        return total === 0 ? 100 : Math.round((responded / total) * 100);
      })(),
    ]);

    return {
      current: currentRate,
      previous: previousRate,
      percentageChange: calculatePercentageChange(currentRate, previousRate),
    };
  } catch (error) {
    console.error('Error fetching response rate stats:', error);
    throw new Error('Failed to fetch response rate stats');
  }
});

/**
 * Get client satisfaction stats
 */
export const getClientSatisfactionStats = cache(async (accountRepId: string): Promise<HistoricalStats> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get current average rating (last 30 days)
    const currentRatings = await prisma.clientSatisfaction.aggregate({
      where: {
        accountRepId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    // Get previous average rating (30-60 days ago)
    const previousRatings = await prisma.clientSatisfaction.aggregate({
      where: {
        accountRepId,
        createdAt: {
          lt: thirtyDaysAgo,
          gte: subDays(new Date(), 60),
        },
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    const currentRating = Number(currentRatings._avg.rating?.toFixed(1)) || 0;
    const previousRating = Number(previousRatings._avg.rating?.toFixed(1)) || 0;

    return {
      current: currentRating,
      previous: previousRating,
      percentageChange: calculatePercentageChange(currentRating, previousRating),
    };
  } catch (error) {
    console.error('Error fetching client satisfaction stats:', error);
    throw new Error('Failed to fetch client satisfaction stats');
  }
});

/**
 * Get detailed satisfaction metrics
 */
export interface SatisfactionMetrics {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    [key: number]: number; // 1-5 stars: count
  };
  recentFeedback: {
    rating: number;
    feedback: string;
    clientName: string;
    date: Date;
  }[];
  trend: {
    date: Date;
    rating: number;
    count: number;
  }[];
}

type FeedbackWithUser = ClientSatisfaction & {
  user: {
    name: string | null;
    email: string | null;
  };
};

export const getDetailedSatisfactionMetrics = cache(async (accountRepId: string): Promise<SatisfactionMetrics> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get overall metrics
    const [overallMetrics, ratingDistribution, recentFeedback, trendData] = await Promise.all([
      // Overall average and total
      prisma.clientSatisfaction.aggregate({
        where: {
          accountRepId,
        },
        _avg: {
          rating: true,
        },
        _count: true,
      }),

      // Rating distribution
      prisma.clientSatisfaction.groupBy({
        by: ['rating'],
        where: {
          accountRepId,
        },
        _count: true,
      }),

      // Recent feedback with client info
      prisma.clientSatisfaction.findMany({
        where: {
          accountRepId,
          feedback: {
            not: null,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      // Daily trend for the last 30 days
      prisma.clientSatisfaction.groupBy({
        by: ['createdAt'],
        where: {
          accountRepId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _avg: {
          rating: true,
        },
        _count: true,
      }),
    ]);

    // Initialize rating distribution with all possible values (1-5)
    const distribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    // Update distribution with actual counts
    ratingDistribution.forEach((item) => {
      const rating = Math.round(Number(item.rating));
      if (rating >= 1 && rating <= 5) {
        distribution[rating] = item._count;
      }
    });

    // Process trend data
    const trend = trendData.map((day) => ({
      date: day.createdAt,
      rating: Number(day._avg.rating) || 0,
      count: day._count,
    }));

    return {
      averageRating: Number(overallMetrics._avg.rating?.toFixed(1)) || 0,
      totalRatings: overallMetrics._count,
      ratingDistribution: distribution,
      recentFeedback: (recentFeedback as FeedbackWithUser[]).map((feedback) => ({
        rating: Number(feedback.rating),
        feedback: feedback.feedback || '',
        clientName: feedback.user.name || feedback.user.email || 'Unknown Client',
        date: feedback.createdAt,
      })),
      trend,
    };
  } catch (error) {
    console.error('Error fetching detailed satisfaction metrics:', error);
    throw new Error('Failed to fetch detailed satisfaction metrics');
  }
});

/**
 * Get recent activities for an account representative
 */
export interface RecentActivity {
  id: string;
  client: string;
  action: string;
  time: Date;
  status: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  type: 'message' | 'ticket' | 'update';
}

export const getRecentActivities = cache(async (accountRepId: string): Promise<RecentActivity[]> => {
  try {
    // Get recent messages and combine with client info
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { recipientId: accountRepId },
          { senderId: accountRepId },
        ],
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Transform messages into activities with more detailed information
    return recentMessages.map(message => ({
      id: message.id,
      client: message.sender.name || message.sender.email || 'Unknown Client',
      action: message.isRead ? 'Message read' : 'New message received',
      time: message.createdAt,
      status: message.isRead ? ('completed' as const) : ('pending' as const),
      priority: message.isRead ? ('low' as const) : ('high' as const),
      type: 'message' as const,
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw new Error('Failed to fetch recent activities');
  }
});