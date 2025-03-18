import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    type WhereClause = {
      threadId?: string;
      senderId?: string;
      recipientId?: string;
      isThreadStart?: boolean;
      archived?: boolean;
      isRead?: boolean;
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
          ],
          isThreadStart: true
        };

    // Add view filter
    if (view === 'inbox') {
      where = {
        ...where,
        recipientId: session.user.id,
      };
    } else if (view === 'outbox') {
      where = {
        ...where,
        senderId: session.user.id,
      };
    }

    // Add archived filter
    if (showArchived !== undefined) {
      where.archived = showArchived;
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
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 