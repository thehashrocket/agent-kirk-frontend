/**
 * @file src/lib/services/ticket-service.ts
 * Service for handling ticket operations
 */

import { prisma } from "@/lib/prisma";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/tickets";
import { Prisma } from "@prisma/client";

interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  clientId: string;
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

interface GetTicketsParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  clientId?: string;
  accountRepId?: string;
  search?: string;
}

export async function getTickets(params: GetTicketsParams) {
  const { status, priority, assignedToId, clientId, accountRepId, search } = params;

  const where: Prisma.TicketWhereInput = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId && { assignedToId }),
    ...(clientId && { clientId }),
    ...(accountRepId && {
      client: {
        accountRepId,
      },
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      attachments: true,
      tags: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return tickets;
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          accountRepId: true,
        },
      },
      attachments: true,
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      tags: true,
    },
  });

  return ticket;
}

export async function createTicket(data: Prisma.TicketCreateInput) {
  const ticket = await prisma.ticket.create({
    data,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return ticket;
}

export async function updateTicket(id: string, data: Prisma.TicketUpdateInput) {
  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return ticket;
}

export async function getTicketStats(accountRepId?: string) {
  const baseFilter = accountRepId ? {
    client: {
      accountRepId
    }
  } : {};

  // Get current period stats
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Current period stats - count all current tickets, not just those created in last 24h
  const [currentTotal, currentOpen, currentInProgress, currentResolved, currentTickets] = await Promise.all([
    prisma.ticket.count({
      where: {
        ...baseFilter
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'OPEN'
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'IN_PROGRESS'
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'RESOLVED'
      }
    }),
    prisma.ticket.findMany({
      where: {
        ...baseFilter,
        status: { not: 'OPEN' },
        updatedAt: { gte: twentyFourHoursAgo } // Look at tickets updated in last 24h for response time
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })
  ]);

  // Previous period stats - for percentage change calculation
  const [previousTotal, previousOpen, previousInProgress, previousResolved, previousTickets] = await Promise.all([
    prisma.ticket.count({
      where: {
        ...baseFilter,
        createdAt: { 
          lt: twentyFourHoursAgo
        }
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'OPEN',
        createdAt: { 
          lt: twentyFourHoursAgo
        }
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'IN_PROGRESS',
        createdAt: { 
          lt: twentyFourHoursAgo
        }
      }
    }),
    prisma.ticket.count({
      where: {
        ...baseFilter,
        status: 'RESOLVED',
        createdAt: { 
          lt: twentyFourHoursAgo
        }
      }
    }),
    prisma.ticket.findMany({
      where: {
        ...baseFilter,
        status: { not: 'OPEN' },
        updatedAt: { 
          gte: fortyEightHoursAgo,
          lt: twentyFourHoursAgo
        }
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })
  ]);

  // Calculate current period average response time
  const currentResponseTime = currentTickets.reduce((acc: number, ticket) => {
    const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
    return acc + responseTime;
  }, 0);

  const currentAverageResponseTime = currentTickets.length > 0
    ? (currentResponseTime / currentTickets.length) / (1000 * 60 * 60) // Convert to hours
    : 0;

  // Calculate previous period average response time
  const previousResponseTime = previousTickets.reduce((acc: number, ticket) => {
    const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
    return acc + responseTime;
  }, 0);

  const previousAverageResponseTime = previousTickets.length > 0
    ? (previousResponseTime / previousTickets.length) / (1000 * 60 * 60) // Convert to hours
    : 0;

  // Calculate percentage changes
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  return {
    total: currentTotal,
    open: currentOpen,
    inProgress: currentInProgress,
    resolved: currentResolved,
    averageResponseTime: currentAverageResponseTime,
    percentageChanges: {
      total: calculatePercentageChange(currentTotal, previousTotal),
      open: calculatePercentageChange(currentOpen, previousOpen),
      inProgress: calculatePercentageChange(currentInProgress, previousInProgress),
      resolved: calculatePercentageChange(currentResolved, previousResolved),
      averageResponseTime: calculatePercentageChange(currentAverageResponseTime, previousAverageResponseTime),
    }
  };
} 