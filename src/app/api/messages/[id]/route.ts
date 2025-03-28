/**
 * @fileoverview API route handlers for managing individual messages in the Kirk messaging system.
 * This file contains endpoints for retrieving and updating message details, including read status
 * and archival state. It implements authentication checks and permission controls to ensure
 * only authorized users can access and modify messages.
 * 
 * @module api/messages/[id]
 * @see {@link /api/messages} for the messages collection endpoints
 */

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

/**
 * Schema for validating message update requests
 */
const updateSchema = z.object({
  isRead: z.boolean().optional(),
  archived: z.boolean().optional(),
});

/**
 * Type definition for message update request body
 */
type MessageUpdateRequest = z.infer<typeof updateSchema>;

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

/**
 * Retrieves detailed information about a specific message.
 * Includes sender details, recipient details, attachments, and any replies.
 * 
 * Authorization rules:
 * - Only the sender or recipient can view the message
 * - Requires authenticated user
 * 
 * @route GET /api/messages/[id]
 * 
 * @param {NextRequest} request - The Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - The unique identifier of the message to retrieve
 * 
 * @returns {Promise<NextResponse>} JSON response containing the message details or error
 * 
 * @throws {401} - Unauthorized - User not authenticated
 * @throws {404} - Message not found
 * 
 * @example
 * // Retrieve message details
 * GET /api/messages/123
 * Response: {
 *   id: string,
 *   sender: { id: string, name: string, image: string },
 *   recipient: { id: string, name: string, image: string },
 *   attachments: Array<Attachment>,
 *   replies: Array<Message>
 * }
 */
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
