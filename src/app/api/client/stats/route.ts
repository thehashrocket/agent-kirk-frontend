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

type UserRole = {
  id: string;
  name: string;
};

type DbUser = {
  id: string;
  role: UserRole;
};

type SessionUser = {
  id: string;
  role: string | UserRole;
};

const ALLOWED_ROLES = ['CLIENT', 'ADMIN', 'ACCOUNT_REP'];

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
 * @access Private - Requires authenticated user with CLIENT, ADMIN, or ACCOUNT_REP role
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
 * @throws {401} If user is not authenticated or has invalid role
 * @throws {500} If there's an internal server error during data retrieval
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Get the authenticated user
    let sessionUser = (await getServerSession(authOptions))?.user as SessionUser | undefined;
    console.log('Stats API - Session:', JSON.stringify({ user: sessionUser }, null, 2));
    
    // Check Authorization header as fallback
    if (!sessionUser) {
      const authHeader = request.headers.get('authorization');
      console.log('Stats API - Auth Header:', authHeader);
      
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('Stats API - No valid Authorization header');
        return NextResponse.json({ error: 'Unauthorized - No valid authorization' }, { status: 401 });
      }
      
      const userId = authHeader.split(' ')[1];
      if (!userId) {
        console.log('Stats API - No user ID in Authorization header');
        return NextResponse.json({ error: 'Unauthorized - No user ID' }, { status: 401 });
      }
      
      // Get user from database to verify role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: {
            select: {
              name: true
            }
          }
        }
      }) as DbUser | null;
      
      const roleName = user?.role?.name;
      if (!user || !roleName || !ALLOWED_ROLES.includes(roleName)) {
        console.log('Stats API - Invalid user or role:', user);
        return NextResponse.json({ error: 'Unauthorized - Invalid user or role' }, { status: 401 });
      }
      
      sessionUser = { id: user.id, role: user.role.name };
    } else {
      const roleName = typeof sessionUser.role === 'object' ? sessionUser.role?.name : sessionUser.role;
      if (!ALLOWED_ROLES.includes(roleName)) {
        console.log('Stats API - Unauthorized. Session user:', sessionUser);
        return NextResponse.json({ error: 'Unauthorized - Invalid session or role' }, { status: 401 });
      }
    }

    // At this point sessionUser is guaranteed to be defined and have an allowed role
    const user = { 
      id: sessionUser.id, 
      role: typeof sessionUser.role === 'object' ? sessionUser.role.name : sessionUser.role 
    };

    // For non-CLIENT roles, we need to get the client ID from the request
    let clientId = user.role === 'CLIENT' ? user.id : new URL(request.url).searchParams.get('clientId');
    
    if (!clientId) {
      if (user.role === 'CLIENT') {
        clientId = user.id;
      } else {
        return NextResponse.json({ error: 'Missing clientId parameter' }, { status: 400 });
      }
    }

    // If not a CLIENT, verify the user has permission to access this client's data
    if (user.role !== 'CLIENT' && user.role !== 'ADMIN') {
      // For ACCOUNT_REP, verify they are assigned to this client
      const hasAccess = await prisma.clientAccountRep.findFirst({
        where: {
          accountRepId: user.id,
          clientId: clientId,
        },
      });

      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized - Not assigned to this client' }, { status: 401 });
      }
    }

    // Get the current date and first day of the month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get monthly queries count
    const monthlyQueries = await prisma.query.count({
      where: {
        userId: clientId, // Use clientId instead of user.id
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
          userId: clientId,
        },
      }),
      prisma.query.count({
        where: {
          userId: clientId,
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
        userId: clientId,
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
      ? (recentQueries.reduce((acc: number, query: { updatedAt: Date; createdAt: Date }) => {
          const responseTime = query.updatedAt.getTime() - query.createdAt.getTime();
          return acc + responseTime;
        }, 0) / recentQueries.length / 1000).toFixed(1)
      : "0.0";

    // Get user settings for API credits
    const userSettings = await prisma.userSettings.findUnique({
      where: {
        userId: clientId,
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
        userId: clientId,
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