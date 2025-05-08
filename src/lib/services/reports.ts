/**
 * @fileoverview Reports service module for generating system-wide and account-specific analytics.
 * This module provides functions to generate detailed reports including metrics, activities,
 * and performance data for both system-wide analysis and individual account representatives.
 */

import { prisma } from "@/lib/prisma";
import { ActivityStatus, TicketStatus } from "@/prisma/generated/client";
import type { ReportData } from "@/lib/api/reports";
import { subDays, startOfDay, endOfDay, parseISO, format } from "date-fns";

/**
 * Generates a comprehensive system-wide report including user metrics, activities, and performance data.
 * 
 * @param {string} [startDate] - Optional start date for filtering data (ISO format: YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering data (ISO format: YYYY-MM-DD)
 * @returns {Promise<ReportData>} A promise that resolves to the complete report data
 * 
 * @example
 * ```typescript
 * // Get report for a specific date range
 * const report = await getReportData('2024-01-01', '2024-01-31');
 * 
 * // Get report for all time
 * const allTimeReport = await getReportData();
 * ```
 */
export async function getReportData(startDate?: string, endDate?: string): Promise<ReportData> {
  // Create date filter for queries based on optional date range
  const dateFilter = {
    createdAt: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };

  // Fetch basic user metrics in parallel for efficiency
  const [totalUsers, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { isActive: true },
    }),
  ]);

  // Fetch recent activities with user details
  const activities = await prisma.clientActivity.findMany({
    where: dateFilter,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate action type distribution and percentages
  const actionCounts = await prisma.clientActivity.groupBy({
    by: ["type"],
    _count: {
      _all: true,
    },
    where: dateFilter,
  });

  const totalActions = actionCounts.reduce((sum, action) => sum + action._count._all, 0);
  
  const actions = actionCounts.map((action) => ({
    type: action.type,
    count: action._count._all,
    percentage: (action._count._all / totalActions) * 100,
  }));

  // Calculate system error rate from activities
  const [totalActivities, errorActivities] = await Promise.all([
    prisma.clientActivity.count({
      where: dateFilter,
    }),
    prisma.clientActivity.count({
      where: {
        ...dateFilter,
        status: ActivityStatus.ERROR,
      },
    }),
  ]);

  const errorRate = totalActivities > 0 ? (errorActivities / totalActivities) * 100 : 0;

  // Calculate average ticket resolution time
  const tickets = await prisma.ticket.findMany({
    where: {
      ...dateFilter,
      status: TicketStatus.RESOLVED,
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  const avgResponseTime = tickets.reduce((sum, ticket) => {
    const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
    return sum + responseTime;
  }, 0) / (tickets.length || 1);

  // Calculate user engagement metrics for last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dailyActiveUsers, monthlyActiveUsers] = await Promise.all([
    prisma.clientActivity.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        },
      },
      _count: true,
    }).then((result) => result.length),
    prisma.clientActivity.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    }).then((result) => result.length),
  ]);

  // Calculate user retention rate
  const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Compile system performance metrics
  const performanceMetrics = {
    cpu: 45.5, // Mock value - integrate with monitoring service
    memory: 62.3, // Mock value - integrate with monitoring service
    errorRate,
    responseTime: avgResponseTime / 1000, // Convert to seconds
  };

  return {
    metrics: {
      totalUsers,
      activeUsers,
      totalActions,
      errorRate,
      averageResponseTime: avgResponseTime / 1000,
    },
    actions,
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      status: activity.status.toLowerCase() as "success" | "error" | "pending",
      metadata: activity.metadata as Record<string, any>,
    })),
    performanceMetrics,
    userEngagement: {
      dailyActiveUsers,
      averageSessionDuration: 420, // Mock value - implement session tracking
      retentionRate,
    },
  };
}

/**
 * Interface defining the structure of account representative report data.
 * Contains detailed metrics about client interactions, performance, and engagement.
 */
export interface AccountRepReportData {
  metrics: {
    totalClients: number;
    activeClients: number;
    averageResponseTime: number;
    clientSatisfactionScore: number;
  };
  activities: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: "success" | "error" | "pending";
    metadata: Record<string, any>;
    clientName: string;
  }[];
  performanceMetrics: {
    ticketResolutionRate: number;
    averageResponseTime: number;
    clientRetentionRate: number;
    errorRate: number;
  };
  clientEngagement: {
    activeClientsToday: number;
    averageClientInteractions: number;
    retentionRate: number;
  };
}

/**
 * Generates a detailed report for a specific account representative including client metrics,
 * activities, and performance data.
 * 
 * @param {string} accountRepId - The unique identifier of the account representative
 * @param {string} [startDate] - Optional start date for filtering data (ISO format: YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering data (ISO format: YYYY-MM-DD)
 * @returns {Promise<AccountRepReportData>} A promise that resolves to the account rep's report data
 * @throws {Error} When the CLIENT role is not found in the system
 * 
 * @example
 * ```typescript
 * // Get report for specific date range
 * const repReport = await getAccountRepReportData(
 *   'rep-123',
 *   '2024-01-01',
 *   '2024-01-31'
 * );
 * 
 * // Get last 30 days report
 * const recentReport = await getAccountRepReportData('rep-123');
 * ```
 * 
 * @remarks
 * - If no dates are provided, defaults to the last 30 days from the most recent activity
 * - All dates are converted to UTC for consistent querying
 * - Performance metrics include ticket resolution rate, response time, and error rates
 * - Client engagement metrics track daily active clients and interaction averages
 */
export async function getAccountRepReportData(
  accountRepId: string,
  startDate?: string,
  endDate?: string
): Promise<AccountRepReportData> {
  // Default to last 30 days if no date range provided
  if (!startDate || !endDate) {
    const mostRecentActivity = await prisma.clientActivity.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (mostRecentActivity) {
      const endDateTime = endOfDay(mostRecentActivity.createdAt);
      const startDateTime = startOfDay(subDays(endDateTime, 30));
      
      endDate = format(endDateTime, 'yyyy-MM-dd');
      startDate = format(startDateTime, 'yyyy-MM-dd');
    }
  }

  // Convert input dates to UTC for consistent querying
  const utcStartDate = startDate ? new Date(`${startDate}T00:00:00Z`) : undefined;
  const utcEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;

  const dateFilter = {
    createdAt: {
      ...(utcStartDate && { gte: utcStartDate }),
      ...(utcEndDate && { lte: utcEndDate }),
    },
  };

  // Verify and fetch client role
  const clientRole = await prisma.role.findUnique({
    where: { name: "CLIENT" },
  });

  if (!clientRole) {
    throw new Error("Client role not found");
  }

  // Fetch client metrics for the account rep
  const [totalClients, activeClients] = await Promise.all([
    prisma.user.count({
      where: {
        accountRepId,
        roleId: clientRole.id,
      },
    }),
    prisma.user.count({
      where: {
        accountRepId,
        isActive: true,
        roleId: clientRole.id,
      },
    }),
  ]);

  // Fetch all client activities for the period
  const activities = await prisma.clientActivity.findMany({
    where: {
      user: {
        accountRepId,
      },
      ...dateFilter,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate average client satisfaction rating
  const satisfactionData = await prisma.clientSatisfaction.aggregate({
    where: {
      accountRepId,
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    _avg: {
      rating: true,
    },
  });

  // Calculate ticket resolution metrics
  const [totalTickets, resolvedTickets] = await Promise.all([
    prisma.ticket.count({
      where: {
        assignedToId: accountRepId,
        ...dateFilter,
      },
    }),
    prisma.ticket.count({
      where: {
        assignedToId: accountRepId,
        status: TicketStatus.RESOLVED,
        ...dateFilter,
      },
    }),
  ]);

  // Calculate average response time for resolved tickets
  const tickets = await prisma.ticket.findMany({
    where: {
      assignedToId: accountRepId,
      status: TicketStatus.RESOLVED,
      ...dateFilter,
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  const avgResponseTime =
    tickets.reduce((sum, ticket) => {
      const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
      return sum + responseTime;
    }, 0) / (tickets.length || 1);

  // Calculate error rate from activities
  const [totalActivities, errorActivities] = await Promise.all([
    prisma.clientActivity.count({
      where: {
        user: {
          accountRepId,
        },
        ...dateFilter,
      },
    }),
    prisma.clientActivity.count({
      where: {
        user: {
          accountRepId,
        },
        status: ActivityStatus.ERROR,
        ...dateFilter,
      },
    }),
  ]);

  const errorRate = totalActivities > 0 ? (errorActivities / totalActivities) * 100 : 0;

  // Calculate today's client engagement metrics
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));

  const [activeClientsToday, clientInteractions] = await Promise.all([
    prisma.clientActivity.groupBy({
      by: ["userId"],
      where: {
        user: {
          accountRepId,
        },
        createdAt: {
          gte: today,
        },
      },
      _count: true,
    }).then((result) => result.length),
    prisma.clientActivity.groupBy({
      by: ["userId"],
      where: {
        user: {
          accountRepId,
        },
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  // Calculate average interactions per client
  const totalInteractions = clientInteractions.reduce(
    (sum, interaction) => sum + interaction._count._all,
    0
  );
  const clientsWithInteractions = clientInteractions.length;
  const averageClientInteractions = 
    clientsWithInteractions > 0 ? totalInteractions / clientsWithInteractions : 0;

  return {
    metrics: {
      totalClients,
      activeClients,
      averageResponseTime: avgResponseTime / 1000, // Convert to seconds
      clientSatisfactionScore: Number(satisfactionData._avg.rating?.toFixed(1)) || 0,
    },
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      status: activity.status.toLowerCase() as "success" | "error" | "pending",
      metadata: activity.metadata as Record<string, any>,
      clientName: activity.user.name || "Unknown Client",
    })),
    performanceMetrics: {
      ticketResolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
      averageResponseTime: avgResponseTime / 1000,
      clientRetentionRate: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
      errorRate,
    },
    clientEngagement: {
      activeClientsToday,
      averageClientInteractions,
      retentionRate: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
    },
  };
}

/**
 * Interface for LLM query metrics
 */
export interface LlmQueryMetrics {
  overall: {
    totalQueries: number;
    averageRating: number;
    positiveRatings: number;
    neutralRatings: number;
    negativeRatings: number;
  };
  recentQueries: Array<{
    content: string;
    response: string;
    rating: number;
    createdAt: Date;
    clientName: string;
  }>;
  ratingTrend: Array<{
    date: string;
    averageRating: number;
    totalQueries: number;
  }>;
  clientSatisfaction: Array<{
    clientName: string;
    totalQueries: number;
    averageRating: number;
    positivePercentage: number;
  }>;
}

/**
 * Fetches LLM query metrics for an account representative
 */
export async function getLlmQueryMetrics(
  accountRepId: string,
  startDate?: string,
  endDate?: string
): Promise<LlmQueryMetrics> {
  // Convert input dates to UTC for consistent querying
  const utcStartDate = startDate ? new Date(`${startDate}T00:00:00Z`) : subDays(new Date(), 30);
  const utcEndDate = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();

  // Get all queries for the account rep's clients
  const queries = await prisma.query.findMany({
    where: {
      user: {
        accountRepId,
      },
      createdAt: {
        gte: utcStartDate,
        lte: utcEndDate,
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
  });

  // Calculate overall metrics
  const totalQueries = queries.length;
  const positiveRatings = queries.filter(q => q.rating === 1).length;
  const neutralRatings = queries.filter(q => q.rating === 0).length;
  const negativeRatings = queries.filter(q => q.rating === -1).length;
  const averageRating = totalQueries > 0
    ? queries.reduce((sum, q) => sum + q.rating, 0) / totalQueries
    : 0;

  // Get recent queries
  const recentQueries = queries.slice(0, 5).map(q => ({
    content: q.content,
    response: q.response || '',
    rating: q.rating,
    createdAt: q.createdAt,
    clientName: q.user.name || q.user.email || 'Unknown Client',
  }));

  // Calculate daily rating trends
  const queryByDate = queries.reduce((acc, q) => {
    const date = q.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { sum: 0, count: 0 };
    }
    acc[date].sum += q.rating;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const ratingTrend = Object.entries(queryByDate).map(([date, data]) => ({
    date,
    averageRating: data.sum / data.count,
    totalQueries: data.count,
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate per-client satisfaction
  const clientQueries = queries.reduce((acc, q) => {
    const clientName = q.user.name || q.user.email || 'Unknown Client';
    if (!acc[clientName]) {
      acc[clientName] = { sum: 0, total: 0, positive: 0 };
    }
    acc[clientName].sum += q.rating;
    acc[clientName].total += 1;
    if (q.rating === 1) acc[clientName].positive += 1;
    return acc;
  }, {} as Record<string, { sum: number; total: number; positive: number }>);

  const clientSatisfaction = Object.entries(clientQueries).map(([clientName, data]) => ({
    clientName,
    totalQueries: data.total,
    averageRating: data.sum / data.total,
    positivePercentage: (data.positive / data.total) * 100,
  })).sort((a, b) => b.averageRating - a.averageRating);

  return {
    overall: {
      totalQueries,
      averageRating,
      positiveRatings,
      neutralRatings,
      negativeRatings,
    },
    recentQueries,
    ratingTrend,
    clientSatisfaction,
  };
} 