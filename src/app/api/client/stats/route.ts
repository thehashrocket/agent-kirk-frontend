/**
 * Client Statistics API Route
 * 
 * This API endpoint provides statistical data for authenticated clients, including:
 * - Monthly query usage
 * - Average response times
 * - Success rates
 * - API credit usage
 * 
 * @route GET /api/client/stats
 * @access Private - Requires authenticated client user
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Response structure for client statistics
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
 * GET handler for client statistics
 * 
 * @returns {Promise<NextResponse<StatsResponse | { error: string }>>} JSON response containing client statistics or error
 * 
 * @throws {401} If user is not authenticated or not a client
 * @throws {500} If there's an internal server error
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