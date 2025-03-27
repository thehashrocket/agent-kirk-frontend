import { prisma } from "@/lib/prisma";
import { ActivityStatus, TicketStatus } from "@prisma/client";
import type { ReportData } from "@/lib/api/reports";

export async function getReportData(startDate?: string, endDate?: string): Promise<ReportData> {
  const dateFilter = {
    createdAt: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };

  // Fetch user metrics
  const [totalUsers, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { isActive: true },
    }),
  ]);

  // Fetch activity metrics
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

  // Calculate action breakdown
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

  // Calculate error rate
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

  // Calculate average response time (from tickets)
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

  // Calculate user engagement
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

  // Calculate retention rate
  const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Calculate system performance metrics (mock for now, would need monitoring service integration)
  const performanceMetrics = {
    cpu: 45.5, // Would come from monitoring service
    memory: 62.3, // Would come from monitoring service
    errorRate,
    responseTime: avgResponseTime / 1000, // Convert to seconds
  };

  return {
    metrics: {
      totalUsers,
      activeUsers,
      totalActions,
      errorRate,
      averageResponseTime: avgResponseTime / 1000, // Convert to seconds
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
      averageSessionDuration: 420, // Would need session tracking
      retentionRate,
    },
  };
}

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

export async function getAccountRepReportData(
  accountRepId: string,
  startDate?: string,
  endDate?: string
): Promise<AccountRepReportData> {
  const dateFilter = {
    createdAt: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  };

  // Fetch client metrics
  const [totalClients, activeClients] = await Promise.all([
    prisma.user.count({
      where: {
        accountRepId,
      },
    }),
    prisma.user.count({
      where: {
        accountRepId,
        isActive: true,
      },
    }),
  ]);

  // Fetch activities with client information
  const activities = await prisma.clientActivity.findMany({
    where: {
      user: {
        accountRepId,
      },
      ...dateFilter,
    },
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

  // Calculate client satisfaction score
  const satisfactionData = await prisma.clientSatisfaction.aggregate({
    where: {
      accountRepId,
      ...dateFilter,
    },
    _avg: {
      rating: true,
    },
  });

  // Calculate ticket metrics
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

  // Calculate average response time from tickets
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

  // Calculate error rate
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

  // Calculate client engagement metrics
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
        ...dateFilter,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const averageClientInteractions =
    clientInteractions.reduce((sum, interaction) => sum + interaction._count._all, 0) /
    (totalClients || 1);

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