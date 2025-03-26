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

export async function getTickets(params: {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  clientId?: string;
  search?: string;
}) {
  const { status, priority, assignedToId, clientId, search } = params;

  const where: Prisma.TicketWhereInput = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId && { assignedToId }),
    ...(clientId && { clientId }),
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

export async function createTicket(data: CreateTicketData) {
  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      status: 'OPEN',
    },
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
  });

  return ticket;
}

export async function updateTicket(id: string, data: UpdateTicketData) {
  const { status, ...rest } = data;
  
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...rest,
      ...(status && { status }),
    } satisfies Prisma.TicketUpdateInput,
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
  });

  return ticket;
}

export async function getTicketStats() {
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
  ]);

  // Calculate average response time (time between ticket creation and first response)
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { not: 'OPEN' },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalResponseTime = tickets.reduce((acc: number, ticket) => {
    const responseTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
    return acc + responseTime;
  }, 0);

  const averageResponseTime = tickets.length > 0
    ? (totalResponseTime / tickets.length) / (1000 * 60 * 60) // Convert to hours
    : 0;

  return {
    total,
    open,
    inProgress,
    resolved,
    averageResponseTime,
  };
} 