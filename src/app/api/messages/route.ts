/**
 * @fileoverview Messages API Route Handler
 * 
 * This module implements the Next.js route handlers for the /api/messages endpoint.
 * It provides RESTful operations for managing messages in the application, including:
 * - Creating new messages and replies (POST)
 * - Retrieving messages with pagination and filtering (GET)
 * 
 * Features:
 * - Authentication via NextAuth
 * - Message threading support
 * - File attachments
 * - Pagination and filtering
 * - Admin role support
 * - Archive functionality
 * - Read/unread status
 * 
 * @module api/messages
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Interface for message attachments
 * @interface MessageAttachment
 */
interface MessageAttachment {
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

/**
 * Zod schema for validating message creation requests.
 * Enforces content length limits and file size restrictions.
 */
const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  recipientId: z.string(),
  parentId: z.string().optional(), // ID of the parent message if this is a reply
  attachments: z.array(z.object({
    filename: z.string(),
    fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
    mimeType: z.string(),
    url: z.string().url()
  })).optional()
});

/**
 * Response structure for a successful message creation
 * @interface MessageResponse
 */
interface MessageResponse {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  threadId?: string;
  parentId?: string;
  isThreadStart: boolean;
  isRead: boolean;
  archived: boolean;
  createdAt: Date;
  attachments: MessageAttachment[];
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  parent?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  };
}

/**
 * Response structure for paginated message retrieval
 * @interface PaginatedMessagesResponse
 */
interface PaginatedMessagesResponse {
  messages: MessageResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Creates a new message or reply in the system.
 * 
 * Handles:
 * - Message validation
 * - Thread creation and management
 * - Attachment processing
 * - User authentication
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with created message or error
 * @throws {Error} When validation fails or database operations fail
 */
export async function POST(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    // If this is a reply, get the thread information
    let threadId: string | undefined;
    let isThreadStart = false;

    if (validatedData.parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: validatedData.parentId },
        select: { threadId: true }
      });

      if (parentMessage) {
        threadId = parentMessage.threadId ?? undefined;
      }
    } else {
      // This is a new thread
      isThreadStart = true;
      threadId = crypto.randomUUID();
    }

    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        senderId: session.user.id,
        recipientId: validatedData.recipientId,
        parentId: validatedData.parentId,
        threadId,
        isThreadStart,
        attachments: {
          create: validatedData.attachments
        }
      },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Retrieves messages based on query parameters.
 * 
 * Supports:
 * - Pagination (page, limit)
 * - Thread filtering
 * - View types (inbox/outbox)
 * - Archive status
 * - Read/unread status
 * - Admin access
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with messages and pagination info
 * @throws {Error} When authentication fails or database operations fail
 */
export async function GET(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const threadId = searchParams.get('threadId');
    const view = searchParams.get('view') || 'inbox';
    const showArchived = searchParams.get('archived') === 'true';
    const showUnread = searchParams.get('unread') === 'true';

    /**
     * Prisma where clause type for message queries.
     * Supports complex filtering based on various message attributes.
     * 
     * @typedef {Object} WhereClause
     * @property {string} [threadId] - Optional thread ID to filter messages by thread
     * @property {string} [senderId] - Optional sender ID to filter messages by sender
     * @property {string} [recipientId] - Optional recipient ID to filter messages by recipient
     * @property {boolean} [isThreadStart] - Optional flag to filter thread start messages
     * @property {boolean} [isRead] - Optional flag to filter read/unread messages
     * @property {boolean} [archived] - Optional flag to filter archived messages
     * @property {Object[]} [AND] - Optional array of AND conditions
     * @property {Object[]} [OR] - Optional array of OR conditions for complex queries
     */
    type WhereClause = {
      threadId?: string;
      senderId?: string;
      recipientId?: string;
      isThreadStart?: boolean;
      isRead?: boolean;
      archived?: boolean;
      AND?: Array<{
        OR?: Array<{
          senderId?: string;
          recipientId?: string;
        }>;
      }>;
      OR?: Array<{
        senderId?: string;
        recipientId?: string;
      }>;
    };

    let where: WhereClause = threadId
      ? { threadId }
      : {
          OR: [
            { senderId: session.user.id },
            { recipientId: session.user.id }
          ]
        };

    // Add view filter
    if (view === 'inbox') {
      where = {
        ...where,
        recipientId: session.user.id,
        archived: false // Only show unarchived messages by default
      };
    } else if (view === 'outbox') {
      where = {
        ...where,
        senderId: session.user.id,
        archived: false // Only show unarchived messages by default
      };
    }

    // Add archived filter only if explicitly requested
    if (showArchived) {
      delete where.archived;
      where.archived = true;
    }

    // Add unread filter
    if (showUnread) {
      where.isRead = false;
    }

    // Allow admin to see all messages
    if (session.user.role !== 'ADMIN') {
      where = {
        AND: [
          where,
          {
            OR: [
              { senderId: session.user.id },
              { recipientId: session.user.id }
            ]
          }
        ]
      };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          attachments: true,
          sender: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          replies: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              },
              recipient: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              },
              attachments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.message.count({ where })
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 