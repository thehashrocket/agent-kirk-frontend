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

const ALLOWED_ROLES = ['CLIENT', 'ADMIN', 'ACCOUNT_REP'];

interface SessionUser {
  id: string;
  role: string;
  impersonatedUserId?: string;
}

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
  // Get the authenticated user
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;
  
  // If impersonating, use the impersonated user's ID
  if (session?.user?.impersonatedUserId) {
    userId = session.user.impersonatedUserId;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized - No valid user ID' }, { status: 401 });
  }

  try {
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
    });
      
    const roleName = user?.role?.name;
    if (!user || !roleName || !ALLOWED_ROLES.includes(roleName)) {
      console.log('Stats API - Invalid user or role:', user);
      return NextResponse.json({ error: 'Unauthorized - Invalid user or role' }, { status: 401 });
    }

    // Fetch stats for the user
    const stats = await prisma.gaAccount.findMany({
      where: {
        userId: userId
      },
      include: {
        gaProperties: true
      }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 