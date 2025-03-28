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
 * @route POST /api/llm/chat/send
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  ChatRequestSchema, 
  ChatResponse, 
  ErrorResponse, 
  CHAT_CONSTANTS 
} from '@/lib/validations/chat';

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
        content: validatedData.query,
        status: 'PENDING',
        userId: session.user.id,
        conversationId: validatedData.conversationID,
      },
    });

    // Prepare request payload for LLM service
    const llmRequestPayload = {
      queryId: query.id,
      query: validatedData.query,
      userId: session.user.id,
      conversationId: validatedData.conversationID,
      accountGA4: validatedData.accountGA4,
      propertyGA4: validatedData.propertyGA4,
      dateToday: validatedData.dateToday,
    };

    // Log outgoing request
    console.log('Sending request to LLM service:', llmRequestPayload);

    // Send request to LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_SERVICE_API_KEY}`,
        'X-Query-ID': query.id
      },
      body: JSON.stringify(llmRequestPayload),
    });

    // Log and parse the response
    const responseText = await llmResponse.text();
    console.log('LLM service response status:', llmResponse.status);
    console.log('LLM service raw response:', responseText);

    // Handle error responses from LLM service
    if (!llmResponse.ok) {
      const errorResponse = await handleLLMError(responseText, llmResponse.status, query.id);
      return NextResponse.json(errorResponse, { status: llmResponse.status });
    }

    // Parse and handle successful response
    const responseData = await parseLLMResponse(responseText);

    // Handle immediate response
    if (responseData.response) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'COMPLETED',
          response: responseData.response,
        },
      });

      return NextResponse.json({
        status: 'COMPLETED',
        queryId: query.id,
        response: responseData.response,
      });
    }

    // Handle error in response
    if (responseData.error) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'FAILED',
          response: responseData.error,
        },
      });

      return NextResponse.json({
        status: 'FAILED',
        queryId: query.id,
        error: responseData.error,
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
  
  try {
    const errorData = JSON.parse(responseText);
    errorMessage = errorData.message || errorData.error || errorMessage;
    errorDetails = errorData;
  } catch (e) {
    console.error('Failed to parse error response:', e);
    errorMessage = responseText || errorMessage;
  }

  console.error('LLM service error:', {
    status,
    message: errorMessage,
    details: errorDetails,
    queryId
  });
  
  // Update query status to failed with detailed error
  await prisma.query.update({
    where: { id: queryId },
    data: { 
      status: 'FAILED', 
      response: JSON.stringify({
        error: errorMessage,
        status,
        details: errorDetails
      })
    },
  });

  return { 
    error: errorMessage,
    queryId,
    status: 'FAILED',
    details: errorDetails
  };
}

/**
 * Parses the LLM service response
 */
async function parseLLMResponse(responseText: string) {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse success response:', e);
    throw new Error(CHAT_CONSTANTS.ERROR_MESSAGES.INVALID_RESPONSE);
  }
}

/**
 * Handles unexpected errors during request processing
 */
async function handleUnexpectedError(error: unknown, queryId?: string): Promise<NextResponse<ErrorResponse>> {
  console.error('Chat API Error:', error);
  
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