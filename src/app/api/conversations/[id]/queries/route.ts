/**
 * @fileoverview API route handler for conversation queries.
 * This file implements endpoints for fetching and creating conversation queries,
 * integrating with an LLM service for processing messages.
 * 
 * Endpoints:
 * - GET /api/conversations/[id]/queries - Fetches all queries for a conversation
 * - POST /api/conversations/[id]/queries - Creates a new query in a conversation
 * 
 * Authentication: Requires a valid session with user email
 * Authorization: Users can only access their own conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { MESSAGE_STATUS } from '@/types/chat';

/**
 * Interface for message objects returned by the GET endpoint
 */
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: string;
}

/**
 * Interface for the POST request body
 */
interface QueryRequest {
  content: string;
}

/**
 * Interface for successful POST response
 */
interface QueryResponse {
  queryId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: string;
}

/**
 * Maximum time to wait for immediate response from LLM service (3 seconds)
 */
const IMMEDIATE_TIMEOUT = 3000;

/**
 * GET handler for fetching conversation queries
 * 
 * @param request - The incoming request object
 * @param context - Route context containing conversation ID
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - On success: Array of messages with query/response pairs
 *   - On error: Error object with appropriate status code
 * 
 * @throws Returns 401 if user is not authenticated
 * @throws Returns 404 if user or conversation is not found
 * @throws Returns 500 on internal server error
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use impersonated user ID if available, otherwise use the actual user ID
    const effectiveUserId = session.user.impersonatedUserId || session.user.id;

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: effectiveUserId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch queries for the conversation
    const queries = await prisma.query.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        content: true,
        response: true,
        status: true,
        createdAt: true,
        rating: true,
      },
    });

    // Format queries to match the Message interface
    const messages = queries.flatMap(query => {
      const messages = [];
      
      // Add user query
      messages.push({
        id: `${query.id}-query`,
        content: query.content,
        role: 'user' as const,
        timestamp: query.createdAt.toLocaleString(),
        status: MESSAGE_STATUS.COMPLETED
      });

      // Add assistant response if it exists
      if (query.response) {
        messages.push({
          id: `${query.id}-response`,
          content: query.response,
          role: 'assistant' as const,
          timestamp: query.createdAt.toLocaleString(),
          rating: query.rating,
          status: query.status === 'COMPLETED' ? MESSAGE_STATUS.COMPLETED :
                 query.status === 'FAILED' ? MESSAGE_STATUS.ERROR :
                 MESSAGE_STATUS.PROCESSING
        });
      }

      return messages;
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching conversation queries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating new conversation queries
 * 
 * @param request - The incoming request object containing message content
 * @param context - Route context containing conversation ID
 * @returns {Promise<NextResponse>} JSON response containing:
 *   - On success: Object with queryId, status, and optional response
 *   - On error: Error object with appropriate status code
 * 
 * @throws Returns 400 if message content is missing
 * @throws Returns 401 if user is not authenticated
 * @throws Returns 404 if user or conversation is not found
 * @throws Returns 500 on internal server error or LLM service failure
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use impersonated user ID if available, otherwise use the actual user ID
    const effectiveUserId = session.user.impersonatedUserId || session.user.id;

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: effectiveUserId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get the message content from the request body
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create the query first
    const query = await prisma.query.create({
      data: {
        content,
        status: 'PENDING',
        userId: effectiveUserId,
        conversationId: id,
      },
    });

    if (!process.env.LLM_SERVICE_URL) {
      throw new Error('LLM_SERVICE_URL is not configured');
    }

    // Send request directly to LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: content,
        queryID: query.id,
        conversationID: id,
        dateToday: new Date().toISOString(),
        accountGA4: 'default',
        propertyGA4: 'default'
      }),
    });

    const data = await llmResponse.json();
    console.log('LLM service response:', data);

    if (!llmResponse.ok) {
      // Update query status to FAILED
      await prisma.query.update({
        where: { id: query.id },
        data: { 
          status: 'FAILED',
          response: `Error: LLM service responded with status ${llmResponse.status}: ${JSON.stringify(data)}`
        },
      });

      return NextResponse.json(
        { error: data.error || 'Failed to process message' },
        { status: llmResponse.status }
      );
    }

    // If we get an immediate response
    if (data.status === 'COMPLETED' && data.response) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'COMPLETED',
          response: data.response
        },
      });
    } else {
      // Mark as in progress if the response will be async
      await prisma.query.update({
        where: { id: query.id },
        data: { status: 'IN_PROGRESS' },
      });

      // Create a notification for the user
      await prisma.notification.create({
        data: {
          type: 'QUERY_COMPLETE',
          title: 'Query Processing',
          content: 'Your query is being processed. You will be notified when it\'s complete.',
          userId: effectiveUserId,
        },
      });
    }

    return NextResponse.json({
      queryId: query.id,
      status: data.status || 'IN_PROGRESS',
      response: data.response,
    });
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 