/**
 * @fileoverview Conversations API Route
 * 
 * This file implements the REST API endpoints for managing conversations in the application.
 * It provides functionality for creating, retrieving, and updating conversation records.
 * All endpoints require authentication via NextAuth session.
 * 
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/route-handlers}
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@/prisma/generated/client';
import { authOptions } from '@/lib/auth';

/**
 * Represents a conversation with its latest query
 * @interface ConversationWithQueries
 */
interface ConversationWithQueries {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: Date;
  gaAccountId?: string;
  gaPropertyId?: string;
  gaAccount?: {
    id: string;
    gaAccountId: string;
    gaAccountName: string;
  };
  gaProperty?: {
    id: string;
    gaPropertyId: string;
    gaPropertyName: string;
  };
  queries: Array<{
    content: string;
  }>;
}

/**
 * Extends PrismaClient type to include our specific conversation model types
 * This ensures type safety when working with conversation-specific queries
 */
declare global {
  type ExtendedPrismaClient = PrismaClient & {
    conversation: {
      findMany: (args: any) => Promise<ConversationWithQueries[]>;
      findFirst: (args: any) => Promise<ConversationWithQueries | null>;
      update: (args: any) => Promise<ConversationWithQueries>;
    };
  };
}

// Cast prisma to our extended type for better type inference
const extendedPrisma = prisma as ExtendedPrismaClient;

/**
 * GET /api/conversations
 * 
 * Retrieves all conversations for the authenticated user, ordered by most recently updated.
 * Includes the most recent query for each conversation.
 * For account reps, includes client information.
 * 
 * @returns {Promise<NextResponse>} JSON response with conversations array or error
 * @throws {NextResponse} 401 if user is not authenticated
 * @throws {NextResponse} 500 if server error occurs
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get current user with role information
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        queries: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            content: true,
          },
        },
        gaAccount: {
          select: {
            id: true,
            gaAccountId: true,
            gaAccountName: true,
          },
        },
        gaProperty: {
          select: {
            id: true,
            gaPropertyId: true,
            gaPropertyName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[CONVERSATION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

/**
 * PATCH /api/conversations
 * 
 * Updates a conversation's properties. Currently supports toggling isStarred status.
 * 
 * @param {Request} request - Contains conversation ID and updated properties
 * @returns {Promise<NextResponse>} JSON response with updated conversation or error
 * @throws {NextResponse} 400 if conversation ID is missing
 * @throws {NextResponse} 401 if user is not authenticated
 * @throws {NextResponse} 404 if conversation is not found
 * @throws {NextResponse} 500 if server error occurs
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, isStarred } = await request.json();
    if (!id) {
      return new NextResponse('Conversation ID is required', { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return new NextResponse('Not found', { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { isStarred },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CONVERSATION_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

/**
 * POST /api/conversations
 * 
 * Creates a new conversation for the authenticated user.
 * Optionally includes Google Analytics account and property IDs.
 * For account reps, can create conversations on behalf of clients.
 * 
 * @param {Request} request - Contains title and optional GA properties
 * @returns {Promise<NextResponse>} JSON response with created conversation or error
 * @throws {NextResponse} 400 if title is missing
 * @throws {NextResponse} 401 if user is not authenticated
 * @throws {NextResponse} 403 if user tries to create conversation for a client they don't manage
 * @throws {NextResponse} 500 if server error occurs
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, gaAccountId, gaPropertyId, clientId } = await request.json();
    if (!title) {
      return new NextResponse('Title is required', { status: 400 });
    }

    // Get current user with role info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Handle account rep creating conversation for a client
    if (clientId && currentUser.role.name === 'ACCOUNT_REP') {
      // Verify that this client belongs to the account rep
      const client = await prisma.user.findFirst({
        where: {
          id: clientId,
          accountRepId: session.user.id,
        },
      });

      if (!client) {
        return new NextResponse('Client not found or not authorized', { status: 403 });
      }

      // Create conversation on behalf of the client
      const conversation = await prisma.conversation.create({
        data: {
          title,
          userId: session.user.id, // The conversation belongs to the account rep
          clientId, // But reference the client ID
          ...(gaAccountId ? { gaAccountId } : {}),
          ...(gaPropertyId ? { gaPropertyId } : {}),
        },
      });

      return NextResponse.json(conversation);
    }

    // Regular user creating their own conversation
    const conversation = await prisma.conversation.create({
      data: {
        title,
        userId: session.user.id,
        ...(gaAccountId ? { gaAccountId } : {}),
        ...(gaPropertyId ? { gaPropertyId } : {}),
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 