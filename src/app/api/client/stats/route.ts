/**
 * @fileoverview Client Statistics API Route Handler
 * This module provides the API endpoint for retrieving authenticated client statistics
 * including monthly query usage, response times, success rates, and API credit usage.
 * 
 * @module api/client/stats
 * @version 1.0.0
 * @license MIT
 * @since 2024-03-21
 * 
 * @requires next/server
 * @requires next-auth
 * @requires @/lib/auth
 * @requires @/lib/prisma
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Response structure for client statistics endpoint
 * 
 * @typedef {Object} StatsResponse
 * @property {Object} stats - Collection of statistical metrics
 * @property {Object} stats.monthlyQueries - Monthly query usage statistics
 * @property {string} stats.monthlyQueries.value - Current month's query count
 * @property {number} stats.monthlyQueries.change - Percentage change from previous month
 * @property {Object} stats.avgResponseTime - Query response time statistics
 * @property {string} stats.avgResponseTime.value - Average response time in seconds
 * @property {number} stats.avgResponseTime.change - Percentage change in response time
 * @property {Object} stats.successRate - Query success rate statistics
 * @property {string} stats.successRate.value - Current success rate percentage
 * @property {number} stats.successRate.change - Change in success rate
 * @property {Object} stats.apiCredits - API credit usage statistics
 * @property {string} stats.apiCredits.value - Current API credits remaining
 * @property {string} stats.apiCredits.total - Total API credits allocated
 * @property {number} stats.apiCredits.change - Change in API credit usage
 */
type StatsResponse = {
  stats: {
    monthlyQueries: {
      value: string;
      change: number;
    };
    avgResponseTime: {
      value: string;
      change: number;
    };
    successRate: {
      value: string;
      change: number;
    };
    apiCredits: {
      value: string;
      total: string;
      change: number;
    };
  };
};

/**
 * Handles GET requests for client statistics
 * 
 * This endpoint provides authenticated clients with their usage statistics including:
 * - Monthly query count and month-over-month change
 * - Average response time for queries in the last 24 hours
 * - Overall query success rate
 * - Current API credit balance and limits
 * 
 * @async
 * @function GET
 * @route {GET} /api/client/stats
 * @access Private - Requires authenticated client user
 * 
 * @returns {Promise<NextResponse<StatsResponse>>} JSON response containing client statistics
 * 
 * @example
 * // Successful response
 * {
 *   stats: {
 *     monthlyQueries: { value: "150", change: 12.5 },
 *     avgResponseTime: { value: "0.8s", change: 0 },
 *     successRate: { value: "98.5%", change: 0 },
 *     apiCredits: { value: "850", total: "1000", change: 0 }
 *   }
 * }
 * 
 * @throws {401} If user is not authenticated or not a client
 * @throws {500} If there's an internal server error during data retrieval
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current date and first day of the month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get monthly queries count
    const monthlyQueries = await prisma.query.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: firstDayOfMonth,
          lte: now,
        },
      },
    });

    // Get total queries for calculating success rate
    const [totalQueries, successfulQueries] = await Promise.all([
      prisma.query.count({
        where: {
          userId: session.user.id,
        },
      }),
      prisma.query.count({
        where: {
          userId: session.user.id,
          response: {
            not: '',
          },
        },
      }),
    ]);

    // Calculate success rate
    const successRate = totalQueries > 0 
      ? ((successfulQueries / totalQueries) * 100).toFixed(1)
      : "100.0";

    // Get recent queries for response time calculation
    const recentQueries = await prisma.query.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Calculate average response time (in seconds)
    const avgResponseTime = recentQueries.length > 0
      ? (recentQueries.reduce((acc, query) => {
          const responseTime = query.updatedAt.getTime() - query.createdAt.getTime();
          return acc + responseTime;
        }, 0) / recentQueries.length / 1000).toFixed(1)
      : "0.0";

    // Get user settings for API credits
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        apiCredits: true,
        apiCreditsLimit: true,
      },
    });

    // Calculate month-over-month changes
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthQueries = await prisma.query.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd,
        },
      },
    });

    const queryChange = lastMonthQueries > 0
      ? ((monthlyQueries - lastMonthQueries) / lastMonthQueries * 100).toFixed(1)
      : "0.0";

    // Return formatted statistics
    return NextResponse.json({
      stats: {
        monthlyQueries: {
          value: monthlyQueries.toString(),
          change: parseFloat(queryChange),
        },
        avgResponseTime: {
          value: `${avgResponseTime}s`,
          change: 0, // Future enhancement: calculate historical change
        },
        successRate: {
          value: `${successRate}%`,
          change: 0, // Future enhancement: calculate historical change
        },
        apiCredits: {
          value: userSettings?.apiCredits?.toString() || "0",
          total: userSettings?.apiCreditsLimit?.toString() || "0",
          change: 0, // Future enhancement: calculate historical change
        },
      },
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 