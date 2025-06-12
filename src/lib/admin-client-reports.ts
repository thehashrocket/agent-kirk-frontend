/**
 * @file src/lib/admin-client-reports.ts
 * Admin Client Reports utility functions for fetching system-wide dashboard statistics
 * Similar to account-rep.ts but provides admin-level access to all clients and their data
 */

import { prisma, type Prisma, type ClientSatisfaction } from './prisma';
import { cache } from 'react';
import { subDays } from 'date-fns';
import type { Decimal } from '@prisma/client/runtime/library';

interface HistoricalStats {
  current: number;
  previous: number;
  percentageChange: number;
}

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

interface ClientWithGaData {
  id: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
  gaAccounts: GaAccount[];
  accountRep?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

/**
 * Calculate percentage change between two numbers
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
}

/**
 * Get all clients with their GA data
 */
export const getAllClientsWithGaData = cache(async (): Promise<ClientWithGaData[]> => {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: {
          name: 'CLIENT'
        }
      },
      include: {
        gaAccounts: {
          where: {
            deleted: false,
          },
          include: {
            gaProperties: {
              where: {
                deleted: false,
              },
            },
          },
        },
        accountRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return clients;
  } catch (error) {
    console.error('Error fetching clients with GA data:', error);
    throw new Error('Failed to fetch clients with GA data');
  }
});

/**
 * Get count of all active clients or specific client status
 */
export const getAllClientsStats = cache(async (clientId?: string): Promise<HistoricalStats> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    if (clientId) {
      // Get specific client data
      const [currentClient, historicalClient] = await Promise.all([
        prisma.user.findUnique({
          where: {
            id: clientId,
            role: {
              name: 'CLIENT'
            }
          },
        }),
        prisma.user.findFirst({
          where: {
            id: clientId,
            role: {
              name: 'CLIENT'
            },
            updatedAt: {
              lt: thirtyDaysAgo,
            },
          },
        }),
      ]);

      return {
        current: currentClient?.isActive ? 1 : 0,
        previous: historicalClient?.isActive ? 1 : 0,
        percentageChange: 0, // Individual client status change doesn't use percentage
      };
    }

    // Get all clients stats
    const [currentCount, previousCount] = await Promise.all([
      // Current active clients
      prisma.user.count({
        where: {
          role: {
            name: 'CLIENT'
          },
          isActive: true,
        },
      }),
      // Active clients from 30 days ago
      prisma.user.count({
        where: {
          role: {
            name: 'CLIENT'
          },
          isActive: true,
          createdAt: {
            lte: thirtyDaysAgo,
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
    console.error('Error fetching clients stats:', error);
    throw new Error('Failed to fetch clients stats');
  }
});

/**
 * Get system-wide response rate stats or for specific client
 */
export const getSystemResponseRateStats = cache(async (clientId?: string): Promise<HistoricalStats> => {
  try {
    const [currentRate, previousRate] = await Promise.all([
      // Current response rate (last 24 hours)
      (async () => {
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const whereClause: any = {
          createdAt: { gte: twentyFourHoursAgo },
        };

        if (clientId) {
          whereClause.OR = [
            { senderId: clientId },
            { recipientId: clientId },
          ];
        }

        const [total, responded] = await Promise.all([
          prisma.message.count({ where: whereClause }),
          prisma.message.count({
            where: {
              ...whereClause,
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
        const whereClause: any = {
          createdAt: {
            gte: fortyEightHoursAgo,
            lt: twentyFourHoursAgo,
          },
        };

        if (clientId) {
          whereClause.OR = [
            { senderId: clientId },
            { recipientId: clientId },
          ];
        }

        const [total, responded] = await Promise.all([
          prisma.message.count({ where: whereClause }),
          prisma.message.count({
            where: {
              ...whereClause,
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
    console.error('Error fetching system response rate stats:', error);
    throw new Error('Failed to fetch system response rate stats');
  }
});

/**
 * Get system-wide client satisfaction stats or for specific client
 */
export const getSystemClientSatisfactionStats = cache(async (clientId?: string): Promise<HistoricalStats> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const whereClause: any = {};
    if (clientId) {
      whereClause.userId = clientId;
    }

    // Get current average rating (last 30 days)
    const currentRatings = await prisma.clientSatisfaction.aggregate({
      where: {
        ...whereClause,
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
        ...whereClause,
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
    console.error('Error fetching system client satisfaction stats:', error);
    throw new Error('Failed to fetch system client satisfaction stats');
  }
});

export interface SystemRecentActivity {
  id: string;
  client: string;
  action: string;
  time: Date;
  status: 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  type: 'message' | 'ticket' | 'update' | 'ga_account' | 'ga_property';
  accountRep?: string;
}

/**
 * Get recent activities across all clients or for specific client
 */
export const getSystemRecentActivities = cache(async (clientId?: string): Promise<SystemRecentActivity[]> => {
  try {
    const activities: SystemRecentActivity[] = [];

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: clientId ? {
        OR: [
          { senderId: clientId },
          { recipientId: clientId },
        ],
      } : {},
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Convert messages to activities
    recentMessages.forEach((message) => {
      const isClientSender = message.sender.role.name === 'CLIENT';
      const clientUser = isClientSender ? message.sender : message.recipient;
      const accountRepUser = isClientSender ? message.recipient : message.sender;

      activities.push({
        id: `message-${message.id}`,
        client: clientUser.name || clientUser.email || 'Unknown Client',
                 action: `${isClientSender ? 'Sent' : 'Received'} message`,
        time: message.createdAt,
        status: message.isRead ? 'completed' : 'pending',
        type: 'message',
        accountRep: accountRepUser.role.name === 'ACCOUNT_REP' 
          ? (accountRepUser.name || accountRepUser.email || 'Unknown Rep')
          : undefined,
      });
    });

         // Note: GaAccount model doesn't have createdAt field, 
     // so we'll skip GA account activities for now

    // Sort all activities by time and return top 15
    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 15);

  } catch (error) {
    console.error('Error fetching system recent activities:', error);
    throw new Error('Failed to fetch system recent activities');
  }
});

/**
 * Get detailed satisfaction metrics for system or specific client
 */
export interface SystemSatisfactionMetrics {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    [key: number]: number; // 1-5 stars: count
  };
  recentFeedback: {
    rating: number;
    feedback: string;
    clientName: string;
    accountRepName?: string;
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
  accountRep: {
    name: string | null;
    email: string | null;
  } | null;
};

export const getSystemDetailedSatisfactionMetrics = cache(async (clientId?: string): Promise<SystemSatisfactionMetrics> => {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const whereClause: any = {};
    if (clientId) {
      whereClause.userId = clientId;
    }

    // Get overall metrics
    const [overallMetrics, ratingDistribution, recentFeedback, trendData] = await Promise.all([
      // Overall average and total
      prisma.clientSatisfaction.aggregate({
        where: whereClause,
        _avg: {
          rating: true,
        },
        _count: true,
      }),

      // Rating distribution
      prisma.clientSatisfaction.groupBy({
        by: ['rating'],
        where: whereClause,
        _count: true,
      }),

      // Recent feedback with client and account rep info
      prisma.clientSatisfaction.findMany({
        where: {
          ...whereClause,
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
          accountRep: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Daily trend for the last 30 days
      prisma.clientSatisfaction.groupBy({
        by: ['createdAt'],
        where: {
          ...whereClause,
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
        accountRepName: feedback.accountRep
          ? (feedback.accountRep.name || feedback.accountRep.email || 'Unknown Rep')
          : undefined,
        date: feedback.createdAt,
      })),
      trend,
    };
  } catch (error) {
    console.error('Error fetching system detailed satisfaction metrics:', error);
    throw new Error('Failed to fetch system detailed satisfaction metrics');
  }
}); 