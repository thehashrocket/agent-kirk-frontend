/**
 * @route PATCH /api/messages/[id]
 * @description Updates a message's status (read/archived). Only the recipient can mark a message as read,
 * while both sender and recipient can archive messages.
 *
 * @authentication Requires user authentication via NextAuth session
 *
 * @param {Object} request - The Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - The ID of the message to update
 *
 * @requestBody {Object} body
 * @property {boolean} [isRead] - Optional. Whether to mark the message as read
 * @property {boolean} [archived] - Optional. Whether to archive the message
 *
 * @returns {Promise<NextResponse>} JSON Response
 * @success {200} Returns the updated message object with sender and attachment details
 *
 * @error {400} Invalid request body
 * @error {401} Unauthorized - User not authenticated or lacks permission
 * @error {404} Message not found
 * @error {500} Internal Server Error
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  isRead: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Check if user has permission to update this message
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        recipientId: true,
        senderId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only recipient can mark as read, both sender and recipient can archive
    if (validatedData.isRead && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (message.recipientId !== session.user.id && message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: validatedData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: true,
      replies: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
      },
    },
  });

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  return NextResponse.json(message);
}
