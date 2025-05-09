/**
 * @file src/lib/admin.ts
 * Admin utility functions for fetching dashboard statistics and system metrics
 */

import { prisma } from './prisma';
import { cache } from 'react';
import { subDays } from 'date-fns';

/**
 * Get total number of users in the system
 * @returns Promise<number>
 */
export const getTotalUsers = cache(async () => {
  try {
    const count = await prisma.user.count();
    return count;
  } catch (error) {
    console.error('Error fetching total users:', error);
    throw new Error('Failed to fetch total users');
  }
});

/**
 * Get number of active users in the system
 * @returns Promise<number>
 */
export const getActiveUsers = cache(async () => {
  try {
    const count = await prisma.user.count({
      where: {
        isActive: true,
      },
    });
    return count;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw new Error('Failed to fetch active users');
  }
});

/**
 * Get API requests per hour
 * Calculates the average requests per hour over the last 24 hours
 * @returns Promise<number>
 */
export const getApiRequestsPerHour = cache(async () => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentQueries = await prisma.query.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    // Calculate average per hour
    const averagePerHour = Math.round(recentQueries / 24);
    return averagePerHour;
  } catch (error) {
    console.error('Error fetching API requests:', error);
    throw new Error('Failed to fetch API requests');
  }
});

/**
 * Get system health metrics
 * @returns Promise<SystemHealth>
 */
export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  totalApiCredits: number;
  usedApiCredits: number;
}

export const getSystemHealth = cache(async () => {
  try {
    // Get total API credits used across all users
    const apiCreditsData = await prisma.userSettings.aggregate({
      _sum: {
        apiCredits: true,
        apiCreditsLimit: true,
      },
    });

    const totalApiCredits = apiCreditsData._sum.apiCreditsLimit || 0;
    const usedApiCredits = apiCreditsData._sum.apiCredits || 0;

    // Calculate CPU and memory usage (mock values for now, replace with real monitoring)
    const cpuUsage = Math.round((usedApiCredits / totalApiCredits) * 100);
    const memoryUsage = Math.round((usedApiCredits / 1024) * 100) / 100; // Convert to GB

    return {
      cpuUsage,
      memoryUsage,
      totalApiCredits,
      usedApiCredits,
    };
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw new Error('Failed to fetch system health');
  }
});

/**
 * Get overall client satisfaction metrics across all account reps
 */
export const getOverallSatisfactionMetrics = cache(async () => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  try {
    const [currentMetrics, previousMetrics] = await Promise.all([
      // Current period (last 30 days)
      prisma.clientSatisfaction.aggregate({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _avg: {
          rating: true,
        },
        _count: true,
      }),

      // Previous period (30-60 days ago)
      prisma.clientSatisfaction.aggregate({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
            gte: subDays(new Date(), 60),
          },
        },
        _avg: {
          rating: true,
        },
        _count: true,
      }),
    ]);

    const currentRating = Number(currentMetrics._avg.rating?.toFixed(1)) || 0;
    const previousRating = Number(previousMetrics._avg.rating?.toFixed(1)) || 0;
    const percentageChange = previousRating === 0 
      ? 0 
      : Number(((currentRating - previousRating) / previousRating * 100).toFixed(1));

    return {
      averageRating: currentRating,
      totalRatings: currentMetrics._count,
      percentageChange,
    };
  } catch (error) {
    console.error('Error fetching overall satisfaction metrics:', error);
    throw new Error('Failed to fetch overall satisfaction metrics');
  }
});

/**
 * Get account representative performance metrics
 */
export const getAccountRepPerformance = cache(async () => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  try {
    const accountReps = await prisma.user.findMany({
      where: {
        role: {
          name: 'ACCOUNT_REP',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        clients: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
          },
        },
        receivedRatings: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
          select: {
            rating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return accountReps.map(rep => {
      const ratings = rep.receivedRatings;
      const averageRating = ratings.length > 0
        ? Number((ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length).toFixed(1))
        : 0;

      // Process trend data
      const trendData = new Array(30).fill(null).map((_, index) => {
        const date = subDays(new Date(), 29 - index);
        const dayRatings = ratings.filter(
          (r) => r.createdAt.toISOString().split('T')[0] === date.toISOString().split('T')[0]
        );

        const dayAverage = dayRatings.length > 0
          ? Number((dayRatings.reduce((sum, r) => sum + Number(r.rating), 0) / dayRatings.length).toFixed(1))
          : null;

        return {
          date: date.toISOString().split('T')[0],
          rating: dayAverage,
          count: dayRatings.length,
        };
      });

      return {
        id: rep.id,
        name: rep.name || rep.email || 'Unknown',
        activeClients: rep.clients.length,
        averageRating,
        totalRatings: ratings.length,
        ratingTrend: trendData,
      };
    });
  } catch (error) {
    console.error('Error fetching account rep performance:', error);
    throw new Error('Failed to fetch account rep performance');
  }
});

/**
 * Get detailed system usage metrics
 */
export const getSystemUsageMetrics = cache(async () => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  try {
    const [apiUsage, userActivity] = await Promise.all([
      // API usage trends
      prisma.query.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      }),

      // User activity (messages, etc.)
      prisma.message.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      }),
    ]);

    return {
      apiUsage: apiUsage.map(day => ({
        date: day.createdAt,
        count: day._count,
      })),
      userActivity: userActivity.map(day => ({
        date: day.createdAt,
        count: day._count,
      })),
    };
  } catch (error) {
    console.error('Error fetching system usage metrics:', error);
    throw new Error('Failed to fetch system usage metrics');
  }
});

/**
 * Get satisfaction trend data for the last 30 days
 */
export const getSatisfactionTrend = cache(async () => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  try {
    const trend = await prisma.clientSatisfaction.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _avg: {
        rating: true,
      },
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Fill in missing days with null values
    const trendData = new Array(30).fill(null).map((_, index) => {
      const date = subDays(new Date(), 29 - index);
      const dayData = trend.find(
        (d) => d.createdAt.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );

      return {
        date: date.toISOString().split('T')[0],
        rating: dayData ? Number(dayData._avg.rating?.toFixed(1)) || 0 : null,
        count: dayData?._count || 0,
      };
    });

    return trendData;
  } catch (error) {
    console.error('Error fetching satisfaction trend:', error);
    throw new Error('Failed to fetch satisfaction trend');
  }
}); 