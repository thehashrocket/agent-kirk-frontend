/**
 * @fileoverview API route handler for chat message processing with LLM (Language Learning Model) service.
 * 
 * This file implements a Next.js API route that handles chat message requests by:
 * - Managing user authentication and request validation
 * - Interfacing with a Language Learning Model (LLM) service
 * - Persisting chat messages and their states in the database
 * - Handling various response scenarios and error cases
 * 
 * The route supports asynchronous processing where responses may be immediate or delayed,
 * with appropriate status tracking throughout the message lifecycle.
 * 
 * Key features:
 * - Authentication via NextAuth session validation
 * - Request validation using Zod schemas
 * - Database persistence using Prisma
 * - Comprehensive error handling and logging
 * - Support for both synchronous and asynchronous LLM responses
 * 
 * File Path: src/app/api/llm/chat/send/route.ts
 * 
 * @route POST /api/llm/chat/send
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { 
  ChatResponse, 
  ErrorResponse, 
  CHAT_CONSTANTS 
} from '@/lib/validations/chat';

// Update the schema to match the QueryRequest interface
const ChatRequestSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  conversationId: z.string().optional(),
  gaAccountId: z.string().optional(),
  gaPropertyIds: z.array(z.string()).optional(),
  sproutSocialAccountIds: z.array(z.string()).optional(),
  emailClientIds: z.array(z.string()).optional(),
});

/**
 * POST /api/llm/chat/send
 * 
 * Handles chat message requests to the LLM service.
 * 
 * Flow:
 * 1. Validates user authentication
 * 2. Validates request body
 * 3. Creates a database record for the query
 * 4. Sends request to LLM service
 * 5. Handles immediate response or sets status to IN_PROGRESS
 * 
 * @param request - The incoming request object
 * @returns Response with query status and optional response/error
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | ErrorResponse>> {
  let query;
  let errorResponse: ErrorResponse;
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: CHAT_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    // Create a database record for the query
    query = await prisma.query.create({
      data: {
        content: validatedData.content,
        status: 'PENDING',
        userId: session.user.id,
        conversationId: validatedData.conversationId,
      },
    });

    // Prepare request payload for LLM service
    const llmRequestPayload = {
      queryId: query.id,
      content: validatedData.content,
      userId: session.user.id,
      conversationId: validatedData.conversationId,
      gaAccountId: validatedData.gaAccountId,
      gaPropertyIds: validatedData.gaPropertyIds,
      sproutSocialAccountIds: validatedData.sproutSocialAccountIds,
      emailClientIds: validatedData.emailClientIds,
      dateToday: new Date().toISOString(),
      responseUrl: process.env.WEBSITE_URL + '/api/llm/chat/webhook',
      webhookUrl: process.env.WEBSITE_URL + '/api/llm/chat/webhook',
      executionMode: (process.env.NODE_ENV === 'development') ? 'development' : 'production',
      logging: (process.env.NODE_ENV === 'development') ? false : true
    };

    console.log('[Send] LLM request payload:', llmRequestPayload);

    // Send request to LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Query-ID': query.id
      },
      body: JSON.stringify(llmRequestPayload),
    });

    // Log and parse the response
    const responseText = await llmResponse.text();

    if (llmResponse.status === 404) {
      errorResponse = {
        status: 'FAILED',
        queryId: query.id,
        error: 'LLM service returned 404 status'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    // If we get a 500 with "No item to return got found", this likely means
    // the request was accepted but will be processed asynchronously
    if (llmResponse.status === 500 && responseText.includes("No item to return got found")) {
      
      // Check if the webhook has already processed this query
      const updatedQuery = await prisma.query.findUnique({
        where: { id: query.id }
      });

      // If the webhook has already processed this query, return its status
      // if (updatedQuery && (updatedQuery.status === 'COMPLETED' || updatedQuery.status === 'FAILED')) {
      //   console.log('[Send] Query already processed by webhook');
      //   return NextResponse.json({
      //     status: updatedQuery.status,
      //     queryId: query.id,
      //     response: updatedQuery.response || undefined,
      //     metadata: updatedQuery.metadata || undefined
      //   } as ChatResponse);
      // }

      // Otherwise return IN_PROGRESS status
      return NextResponse.json({
        status: 'IN_PROGRESS',
        queryId: query.id,
      });
    }

    

    // If no immediate response and no error, the request is in progress
    return NextResponse.json({
      status: 'IN_PROGRESS',
      queryId: query.id,
    });

  } catch (error) {
    return handleUnexpectedError(error, query?.id);
  }
}

/**
 * Handles errors from the LLM service
 */
async function handleLLMError(responseText: string, status: number, queryId: string): Promise<ErrorResponse> {
  let errorMessage = CHAT_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR;
  let errorDetails: unknown = {};
  let metadata = null;
  
  try {
    const errorData = JSON.parse(responseText);
    errorMessage = errorData.message || errorData.error || errorMessage;
    errorDetails = errorData;
    
    // Extract metadata if available
    if (errorData.line_graph_data || errorData.pie_graph_data || errorData.metric_headers) {
      metadata = {
        line_graph_data: errorData.line_graph_data,
        pie_graph_data: errorData.pie_graph_data,
        metric_headers: errorData.metric_headers
      };
    }
  } catch (e) {
    errorMessage = responseText || errorMessage;
  }

  // Get the query to find the user ID
  const query = await prisma.query.findUnique({
    where: { id: queryId }
  });

  if (query?.userId) {
    // Create a notification for the user instead of updating the query
    await prisma.notification.create({
      data: {
        type: 'QUERY_COMPLETE',
        title: 'Query Processing Error',
        content: `Error processing your query: ${errorMessage}`,
        userId: query.userId,
      },
    });
  }

  return { 
    error: errorMessage,
    queryId,
    status: 'FAILED',
    details: errorDetails,
    metadata
  };
}

/**
 * Parses the LLM service response
 */
async function parseLLMResponse(responseText: string) {
  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (e) {
    throw new Error(CHAT_CONSTANTS.ERROR_MESSAGES.INVALID_RESPONSE);
  }
}

/**
 * Handles unexpected errors during request processing
 */
async function handleUnexpectedError(error: unknown, queryId?: string): Promise<NextResponse<ErrorResponse>> {
  
  // Update query status to failed if we have a query ID
  if (queryId) {
    await prisma.query.update({
      where: { id: queryId },
      data: { 
        status: 'FAILED', 
        response: error instanceof Error ? error.message : CHAT_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR
      },
    });
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: CHAT_CONSTANTS.ERROR_MESSAGES.INVALID_REQUEST, 
        details: error.errors 
      } as ErrorResponse,
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { 
      error: CHAT_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR, 
      message: error instanceof Error ? error.message : CHAT_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR
    },
    { status: 500 }
  );
} 