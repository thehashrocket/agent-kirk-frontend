/**
 * @fileoverview LLM Chat Webhook Route
 * This route handles incoming webhooks from the LLM service for chat completions.
 * It processes responses and errors, updates the database, and sends notifications.
 * 
 * @route POST /api/llm/chat/webhook
 * 
 * File Path: src/app/api/llm/chat/webhook/route.ts
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parsePieGraphData } from '@/lib/services/parsePieGraphData';

/**
 * Represents the expected webhook request payload
 */
interface WebhookRequest {
  queryId: string;
  response?: string;
  error?: string;
  line_graph_data?: Array<{
    name: string;
    body?: unknown;
  }>;
  pie_graph_data?: Array<{
    dimensions: unknown[];
    metrics: unknown[];
    prevDiff: unknown[];
    yearDiff: unknown[];
  }>;
  metric_headers?: Array<{
    name: string;
    type: string;
    aggregate: string;
  }>;
}

/**
 * Zod schema for validating webhook requests
 * Ensures either a response or error is provided
 */
const WebhookRequestSchema = z.object({
  queryId: z.string().min(1, "Query ID is required"),
  response: z.string().optional(),
  error: z.string().optional(),
  line_graph_data: z.array(z.object({
    name: z.string(),
    body: z.unknown()
  })).optional(),
  pie_graph_data: z.array(z.object({
    dimensions: z.array(z.unknown()),
    metrics: z.array(z.unknown()),
    prevDiff: z.array(z.unknown()),
    yearDiff: z.array(z.unknown())
  })).optional(),
  metric_headers: z.array(z.object({
    name: z.string(),
    type: z.string(),
    aggregate: z.string()
  })).optional()
}).refine((data) => data.response || data.error, {
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

    console.log('[Webhook] Processing webhook request:', {
      queryId: body.queryId,
      hasResponse: !!body.response,
      hasError: !!body.error,
      hasMetadata: !!(body.line_graph_data || body.pie_graph_data || body.metric_headers)
    });

    // Extract query ID from multiple possible sources for reliability
    let queryId = body.queryId || request.headers.get('x-query-id') || '';
    
    // Log all potential sources of query ID for debugging
    console.log('[Webhook] Query ID sources:', {
      bodyQueryId: body.queryId,
      headerQueryId: request.headers.get('x-query-id'),
      finalQueryId: queryId
    });

    // Return 400 if no query ID is found
    if (!queryId) {
      console.error('[Webhook] Invalid webhook request: No query ID found');
      return NextResponse.json(
        { 
          error: 'Invalid request: No query ID found in body or headers',
          receivedBody: body,
          receivedHeaders: Object.fromEntries(request.headers.entries())
        },
        { status: 400 }
      );
    }

    // Construct metadata object
    const metadata = {
      line_graph_data: body.line_graph_data,
      pie_graph_data: body.pie_graph_data,
      metric_headers: body.metric_headers
    };

    // Construct and validate the webhook data
    const validatedData = {
      queryId,
      response: body.response,
      error: body.error || body.message // Support error from either field
    };

    const result = WebhookRequestSchema.safeParse(validatedData);
    if (!result.success) {
      console.error('[Webhook] Validation error:', {
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
      console.error('[Webhook] Query not found:', {
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

    console.log('[Webhook] Found query in database:', {
      queryId: query.id,
      currentStatus: query.status
    });

    // Prevent duplicate processing of completed queries
    if (query.status === 'COMPLETED' || query.status === 'FAILED') {
      console.log('[Webhook] Query already processed, skipping:', {
        queryId: query.id,
        status: query.status
      });
      return NextResponse.json({ 
        success: true,
        message: 'Query already processed'
      });
    }

    // Handle error case: Update query status and create notification
    if (validatedData.error) {
      console.log('[Webhook] Processing error response');
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'FAILED',
          response: validatedData.error,
          metadata: metadata
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
      console.log('[Webhook] Processing success response');
      try {
        const parsedData = await parseLLMResponse({
          queryId: validatedData.queryId,
          response: validatedData.response,
          error: validatedData.error,
          line_graph_data: metadata.line_graph_data,
          pie_graph_data: metadata.pie_graph_data,
          metric_headers: metadata.metric_headers
        });
        const parsedPieData = parsePieGraphData(metadata.pie_graph_data || []);

        // Use a transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
          // Update the query first
          const updatedQuery = await tx.query.update({
            where: { id: parsedData.queryId },
            data: {
              status: 'COMPLETED',
              response: parsedData.response,
              metadata: {
                metricHeaders: parsedData.metric_headers
              },
              lineGraphData: parsedData.line_graph_data,
              pieGraphData: parsedData.pie_graph_data
            },
          });

          if (parsedData.line_graph_data) {
            console.log('[Webhook] Parsing lineGraphData');
            try {
              await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/queries/${query.id}/chart-data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lineGraphData: parsedData.line_graph_data }),
              });
              console.log(`[Webhook] Parsed lineGraphData successfully`);
            } catch (e) {
              console.error(`[Webhook] Failed to parse lineGraphData`, e);
            }
          }

          if (parsedPieData.length > 0) {
            await tx.parsedPieGraphData.createMany({
              data: parsedPieData.map(data => ({
                queryId: updatedQuery.id,
                channel: data.channel,
                source: data.source,
                sessions: data.sessions,
                conversionRate: data.conversionRate,
                conversions: data.conversions,
                bounces: data.bounces,
                prevSessionsDiff: data.prevSessionsDiff,
                prevConversionRateDiff: data.prevConversionRateDiff,
                prevConversionsDiff: data.prevConversionsDiff,
                prevBouncesDiff: data.prevBouncesDiff,
                yearSessionsDiff: data.yearSessionsDiff,
                yearConversionRateDiff: data.yearConversionRateDiff,
                yearConversionsDiff: data.yearConversionsDiff,
                yearBouncesDiff: data.yearBouncesDiff
              }))
            });
          }

          // Create notification
          await tx.notification.create({
            data: {
              type: 'QUERY_COMPLETE',
              title: 'Query Complete',
              content: 'Your query has been processed and is ready to view.',
              userId: query.userId,
            },
          });
        });

        console.log('[Webhook] Successfully processed webhook data');
      } catch (error) {
        console.error('[Webhook] Error processing webhook data:', error);
        
        // Update query status to failed
        await prisma.query.update({
          where: { id: validatedData.queryId },
          data: {
            status: 'FAILED',
            response: 'Error processing analytics data: ' + (error instanceof Error ? error.message : 'Unknown error'),
          },
        });

        // Create error notification
        await prisma.notification.create({
          data: {
            type: 'QUERY_COMPLETE',
            title: 'Query Processing Failed',
            content: 'There was an error processing your query data.',
            userId: query.userId,
          },
        });

        return NextResponse.json(
          { error: 'Failed to process analytics data' },
          { status: 500 }
        );
      }
    }

    console.log('[Webhook] Successfully processed webhook');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);

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

/**
 * Parses the LLM service response
 */
interface ParsedLLMResponse {
  response?: string;
  error?: string;
  queryId?: string;
  line_graph_data?: object[];
  pie_graph_data?: object[];
  metric_headers?: object[];
}

async function parseLLMResponse(data: WebhookRequest): Promise<ParsedLLMResponse> {
  return {
    response: data.response,
    error: data.error,
    queryId: data.queryId,
    line_graph_data: data.line_graph_data,
    pie_graph_data: data.pie_graph_data,
    metric_headers: data.metric_headers
  };
}