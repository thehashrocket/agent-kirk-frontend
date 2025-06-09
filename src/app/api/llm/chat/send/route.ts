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
  gaPropertyId: z.string().optional(),
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
      console.log('[Send] Unauthorized request');
      return NextResponse.json(
        { error: CHAT_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    console.log('[Send] Processing request for user:', session.user.id);

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    console.log('[Send] Validated data:', validatedData);

    console.log('[Send] Request validated successfully');

    // Create a database record for the query
    query = await prisma.query.create({
      data: {
        content: validatedData.content,
        status: 'PENDING',
        userId: session.user.id,
        conversationId: validatedData.conversationId,
      },
    });

    console.log('[Send] Created query record:', {
      queryId: query.id,
      status: query.status
    });

    // Prepare request payload for LLM service
    const llmRequestPayload = {
      queryId: query.id,
      content: validatedData.content,
      userId: session.user.id,
      conversationId: validatedData.conversationId,
      gaAccountId: validatedData.gaAccountId,
      gaPropertyId: validatedData.gaPropertyId,
      dateToday: new Date().toISOString(),
      website_url: process.env.WEBSITE_URL + '/api/llm/chat/webhook'
    };

    console.log('[Send] Sending request to LLM service:', llmRequestPayload);

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
    console.log('[Send] LLM service response status:', llmResponse.status);
    console.log('[Send] LLM service response URL:', llmResponse.url);
    console.log('[Send] LLM service headers:', llmResponse.headers);

    if (llmResponse.status === 404) {
      console.log('[SEND] LLM URL:', process.env.LLM_SERVICE_URL);
      console.log('[Send] LLM service returned 404 status');
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
      console.log('[Send] Request accepted for async processing');
      
      // Check if the webhook has already processed this query
      const updatedQuery = await prisma.query.findUnique({
        where: { id: query.id }
      });

      console.log('[Send] Checking query status:', {
        queryId: query.id,
        originalStatus: query.status,
        currentStatus: updatedQuery?.status
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

    // Handle other error responses from LLM service
    // if (!llmResponse.ok) {
    //   console.log('[Send] LLM service returned error status');
    //   // Keep the query in PENDING status by not updating it
    //   const errorResponse = await handleLLMError(responseText, llmResponse.status, query.id);
    //   console.log('[Send] Error response:', errorResponse);
    //   // return NextResponse.json(errorResponse, { status: llmResponse.status });
    // }

    // console.log('[Send] LLM service response:', responseText);

    // // Parse and handle successful response
    // console.log('[Send] Parsing LLM service response');
    // const responseData = await parseLLMResponse(responseText);

    // Handle immediate response
    // if (responseData.response) {
    //   console.log('[Send] Processing immediate response');
    //   try {
        
    //     if (responseData.line_graph_data) {
    //       try {
    //         await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/queries/${query.id}/chart-data`, {
    //           method: 'POST',
    //           headers: {
    //             'Content-Type': 'application/json',
    //           },
    //           body: JSON.stringify({ lineGraphData: responseData.line_graph_data }),
    //         });
    //         console.log(`[Send] Parsed lineGraphData successfully`);
    //       } catch (e) {
    //         console.error(`[Send] Failed to parse lineGraphData`, e);
    //       }
    //     }

    //     const updatedQuery = await prisma.query.update({
    //       where: { id: query.id },
    //       data: {
    //         status: 'COMPLETED',
    //         response: responseData.response,
    //         lineGraphData: responseData.line_graph_data,
    //         pieGraphData: responseData.pie_graph_data,
    //         metadata: {
    //           metric_headers: responseData.metric_headers
    //         }
    //       },
    //     });

    //     console.log('[Send] Query updated successfully:', {
    //       queryId: updatedQuery.id,
    //       status: updatedQuery.status,
    //       hasLineData: responseData.line_graph_data.length > 0,
    //       hasPieData: responseData.pie_graph_data.length > 0
    //     });

        

    //     return NextResponse.json({
    //       status: 'COMPLETED',
    //       queryId: query.id,
    //       response: responseData.response,
    //       metadata: {
    //         line_graph_data: responseData.line_graph_data,
    //         pie_graph_data: responseData.pie_graph_data,
    //         metric_headers: responseData.metric_headers
    //       }
    //     });
    //   } catch (error) {
    //     console.error('[Send] Error processing response data:', error);
    //     // Update query status to failed
    //     await prisma.query.update({
    //       where: { id: query.id },
    //       data: {
    //         status: 'FAILED',
    //         response: 'Error processing analytics data: ' + (error instanceof Error ? error.message : 'Unknown error'),
    //       },
    //     });

    //     return NextResponse.json({
    //       status: 'FAILED',
    //       queryId: query.id,
    //       error: 'Failed to process analytics data',
    //     }, { status: 500 });
    //   }
    // }

    // // Handle error in response
    // if (responseData.error) {
    //   console.log('[Send] Processing error in response');
    //   await prisma.query.update({
    //     where: { id: query.id },
    //     data: {
    //       status: 'FAILED',
    //       response: responseData.error,
    //       metadata: {
    //         line_graph_data: responseData.line_graph_data,
    //         pie_graph_data: responseData.pie_graph_data,
    //         metric_headers: responseData.metric_headers
    //       }
    //     },
    //   });

    //   return NextResponse.json({
    //     status: 'FAILED',
    //     queryId: query.id,
    //     error: responseData.error,
    //     metadata: {
    //       line_graph_data: responseData.line_graph_data,
    //       pie_graph_data: responseData.pie_graph_data,
    //       metric_headers: responseData.metric_headers
    //     }
    //   });
    // }

    console.log('[Send] Request is in progress');
    // If no immediate response and no error, the request is in progress
    return NextResponse.json({
      status: 'IN_PROGRESS',
      queryId: query.id,
    });

  } catch (error) {
    console.error('[Send] Unexpected error:', error);
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
    console.error('[Send] Failed to parse error response:', e);
    errorMessage = responseText || errorMessage;
  }

  console.error('[Send] LLM service error:', {
    status,
    message: errorMessage,
    details: errorDetails,
    queryId,
    hasMetadata: !!metadata
  });

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
    console.log('[Send] Attempting to parse LLM response');
    const parsed = JSON.parse(responseText);
    console.log('[Send] Successfully parsed LLM response:', {
      hasResponse: !!parsed.response,
      hasError: !!parsed.error,
      hasMetadata: !!(parsed.line_graph_data || parsed.pie_graph_data || parsed.metric_headers)
    });
    return parsed;
  } catch (e) {
    console.error('[Send] Failed to parse success response:', e);
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