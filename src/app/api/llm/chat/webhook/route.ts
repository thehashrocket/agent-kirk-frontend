/**
 * @fileoverview LLM Chat Webhook Route
 * This route handles incoming webhooks from the LLM service for chat completions.
 * It processes responses and errors, updates the database, and sends notifications.
 * 
 * @route POST /api/llm/chat/webhook
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * Represents the expected webhook request payload
 */
interface WebhookRequest {
  queryId: string;
  response?: string;
  error?: string;
}

/**
 * Zod schema for validating webhook requests
 * Ensures either a response or error is provided
 */
const WebhookRequestSchema = z.object({
  queryId: z.string().min(1, "Query ID is required"),
  response: z.string().optional(),
  error: z.string().optional(),
}).refine(data => data.response || data.error, {
  message: "Either response or error must be provided"
});

/**
 * Handles incoming webhook POST requests from the LLM service
 * 
 * @param request - The incoming Next.js request object
 * @returns NextResponse with appropriate status and message
 * 
 * @throws {z.ZodError} When request validation fails
 * @throws {Error} For any other unexpected errors
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the webhook payload
    const body = await request.json();
    console.log('Webhook received body:', body);

    // Extract query ID from multiple possible sources for reliability
    let queryId = body.queryId || request.headers.get('x-query-id') || '';
    
    // Log all potential sources of query ID for debugging
    console.log('Query ID sources:', {
      bodyQueryId: body.queryId,
      headerQueryId: request.headers.get('x-query-id'),
      finalQueryId: queryId
    });

    // Return 400 if no query ID is found
    if (!queryId) {
      console.error('Invalid webhook request: No query ID found in body or headers');
      return NextResponse.json(
        { 
          error: 'Invalid request: No query ID found in body or headers',
          receivedBody: body,
          receivedHeaders: Object.fromEntries(request.headers.entries())
        },
        { status: 400 }
      );
    }

    // Construct and validate the webhook data
    const validatedData = {
      queryId,
      response: body.response,
      error: body.error || body.message // Support error from either field
    };

    const result = WebhookRequestSchema.safeParse(validatedData);
    if (!result.success) {
      console.error('Webhook validation error:', {
        error: result.error,
        receivedData: validatedData
      });
      return NextResponse.json(
        { 
          error: 'Invalid webhook data',
          details: result.error.errors,
          receivedData: validatedData
        },
        { status: 400 }
      );
    }

    // Fetch the associated query from database
    const query = await prisma.query.findUnique({
      where: { id: validatedData.queryId },
      include: { user: true },
    });

    if (!query) {
      console.error('Query not found:', {
        queryId: validatedData.queryId,
        receivedData: validatedData
      });
      return NextResponse.json(
        { 
          error: 'Query not found',
          queryId: validatedData.queryId,
          receivedData: validatedData
        },
        { status: 404 }
      );
    }

    // Handle error case: Update query status and create notification
    if (validatedData.error) {
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'FAILED',
          response: validatedData.error,
        },
      });

      await prisma.notification.create({
        data: {
          type: 'QUERY_COMPLETE',
          title: 'Query Failed',
          content: 'Your query could not be processed. Please try again.',
          userId: query.userId,
        },
      });
    } 
    // Handle success case: Update query with response and create notification
    else if (validatedData.response) {
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'COMPLETED',
          response: validatedData.response,
        },
      });

      await prisma.notification.create({
        data: {
          type: 'QUERY_COMPLETE',
          title: 'Query Complete',
          content: 'Your query has been processed and is ready to view.',
          userId: query.userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook API Error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.errors },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 