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
import { NotificationType, prisma } from '@/lib/prisma';

/**
 * Represents the expected webhook request payload
 */
interface WebhookRequest {
  queryId: string;
  output?: string;
  success?: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
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
  output: z.string().optional(),
  success: z.boolean().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED']),
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
}).refine((data) => data.queryId || data.status, {
  message: "Either queryId or status must be provided"
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
  let log;
  try {
    // Parse and validate the webhook payload
    const body = await request.json();

    // Extract query ID from multiple possible sources for reliability
    let queryId = body.queryId || request.headers.get('x-query-id') || '';

    // Return 400 if no query ID is found
    if (!queryId) {
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
      output: body.output,
      success: body.success,
      status: body.status
    };

    const result = WebhookRequestSchema.safeParse(validatedData);
    if (!result.success) {
      console.error('[Webhook] Validation error:', {
        error: 'webhook validation error',
        receivedData: validatedData
      });
      // Log the error with additional context
      log = await prisma.log.create({
        data: {
          eventType: 'webhook_validation_error',
          eventMessage: 'Webhook validation failed',
          errorMessage: 'Invalid webhook data',
          errorStackTrace: JSON.stringify(result.error.errors),
          payload: {
            data: JSON.stringify(validatedData),
            metadata: JSON.stringify(metadata),
            body: JSON.stringify(body)
          },
          queryId: validatedData.queryId,
          userId: body.userId || 'unknown',
          serviceName: 'llm-chat',
          version: process.env.npm_package_version || 'unknown',
          requestId: validatedData.queryId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          severity: 'error',
          isAuthenticated: body.isAuthenticated || false,
          permissions: {
            canRead: body.permissions?.canRead || false,
            canWrite: body.permissions?.canWrite || false,
            canDelete: body.permissions?.canDelete || false,
            canUpdate: body.permissions?.canUpdate || false,
          },
          modelName: body.modelName || 'unknown',
          tokenUsage: {
            inputTokens: body.tokenUsage?.inputTokens || 0,
            outputTokens: body.tokenUsage?.outputTokens || 0,
          },
          clientId: body.clientId || 'unknown',
          pageUrl: body.pageUrl || 'unknown',
          componentName: body.componentName || 'unknown',
          errorCode: body.errorCode || 'unknown',
          errorCategory: body.errorCategory || 'validation',
          retryCount: body.retryCount || 0,
        },
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

    // Prevent duplicate processing of completed queries
    if (query.status === 'COMPLETED' || query.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        message: 'Query already processed'
      });
    }

    // Handle error case: Update query status and create notification
    if (!validatedData.success) {
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'FAILED',
          response: validatedData.output,
          metadata: metadata
        },
      });

      log = await prisma.log.create({
        data: {
          eventType: 'webhook_error',
          eventMessage: 'Webhook processing failed',
          errorMessage: validatedData.output || 'Unknown error',
          payload: {
            data: JSON.stringify(validatedData),
            metadata: JSON.stringify(metadata),
            body: JSON.stringify(body)
          },
          queryId: validatedData.queryId,
          userId: query.userId,
          serviceName: 'llm-chat',
          version: process.env.npm_package_version || 'unknown',
          requestId: validatedData.queryId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          severity: 'error',
          isAuthenticated: body.isAuthenticated || false,
          permissions: {
            canRead: body.permissions?.canRead || false,
            canWrite: body.permissions?.canWrite || false,
            canDelete: body.permissions?.canDelete || false,
            canUpdate: body.permissions?.canUpdate || false,
          },
          modelName: body.modelName || 'unknown',
          tokenUsage: {
            inputTokens: body.tokenUsage?.inputTokens || 0,
            outputTokens: body.tokenUsage?.outputTokens || 0,
          },
          clientId: body.clientId || 'unknown',
          pageUrl: body.pageUrl || 'unknown',
          componentName: body.componentName || 'unknown',
          errorCode: body.errorCode || 'unknown',
          errorCategory: body.errorCategory || 'processing',
          retryCount: body.retryCount || 0,
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
    else if (validatedData.success) {
      try {
        const parsedData = await parseLLMResponse({
          queryId: validatedData.queryId,
          output: validatedData.output,
          success: validatedData.success,
          status: validatedData.status,
          line_graph_data: metadata.line_graph_data,
          pie_graph_data: metadata.pie_graph_data,
          metric_headers: metadata.metric_headers
        });

        // Use a transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
          // Update the query first
          const updatedQuery = await tx.query.update({
            where: { id: parsedData.queryId },
            data: {
              status: parsedData.status,
            },
          });

          // Create notification
          // Notify use if the query is completed or in progress or failed.
          if (parsedData.status === 'COMPLETED') {
            await tx.notification.create({
              data: {
                type: NotificationType.QUERY_COMPLETE,
                title: 'Query Complete',
                content: 'Your query has been processed and is ready to view.',
                userId: query.userId,
              },
            });
          } else if (parsedData.status === 'IN_PROGRESS') {
            // don't both the user with a notification for in-progress status
          } else if (parsedData.status === 'FAILED') {
            await tx.notification.create({
              data: {
                type: NotificationType.QUERY_FAILED,
                title: 'Query Processing Failed',
                content: 'There was an error processing your query data.',
                userId: query.userId,
              },
            });
          }
          // Log the successful processing

          // If prasedData.status is 'COMPLETED', log the success
          // if parsedData.status is "IN_PROGRESS", log the in-progress state
          // if parsedData.status is "FAILED", log the failure
          let eventType: string;
          let eventMessage: string;
          switch (parsedData.status) {
            case 'COMPLETED':
              eventType = 'webhook_success';
              eventMessage = 'Webhook processed successfully';
              break;
            case 'IN_PROGRESS':
              eventType = 'webhook_in_progress';
              eventMessage = 'Webhook processing in progress';
              break;
            case 'FAILED':
              eventType = 'webhook_failed';
              eventMessage = 'Webhook processing failed';
              break;
            default:
              eventType = 'webhook_unknown';
              eventMessage = 'Webhook status unknown';
          }

          await tx.log.create({
            data: {
              eventType: eventType,
              eventMessage: eventMessage,
              payload: {
                data: JSON.stringify(parsedData),
                metadata: JSON.stringify(metadata),
                body: JSON.stringify(body)
              },
              queryId: parsedData.queryId,
              userId: query.userId,
              serviceName: 'llm-chat',
              version: process.env.npm_package_version || 'unknown',
              requestId: parsedData.queryId,
              ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
              severity: 'info',
              isAuthenticated: body.isAuthenticated || false,
              permissions: {
                canRead: body.permissions?.canRead || false,
                canWrite: body.permissions?.canWrite || false,
                canDelete: body.permissions?.canDelete || false,
                canUpdate: body.permissions?.canUpdate || false,
              },
              modelName: body.modelName || 'unknown',
              tokenUsage: {
                inputTokens: body.tokenUsage?.inputTokens || 0,
                outputTokens: body.tokenUsage?.outputTokens || 0,
              },
              clientId: body.clientId || 'unknown',
              pageUrl: body.pageUrl || 'unknown',
              componentName: body.componentName || 'unknown',
              errorCode: body.errorCode || 'unknown',
              errorCategory: body.errorCategory || 'processing',
              retryCount: body.retryCount || 0,
            },
          });
        });

      } catch (error) {

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

        console.error('[Webhook] Error processing analytics data:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          queryId: validatedData.queryId,
          receivedData: validatedData
        });

        log = await prisma.log.create({
          data: {
            eventType: 'webhook_processing_error',
            eventMessage: 'Error processing webhook data',
            payload: {
              data: JSON.stringify(validatedData),
              metadata: JSON.stringify(metadata),
              body: JSON.stringify(body)
            },
            queryId: validatedData.queryId,
            serviceName: 'llm-chat',
            version: process.env.npm_package_version || 'unknown',
            requestId: validatedData.queryId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            severity: 'info',
            isAuthenticated: body.isAuthenticated || false,
            permissions: {
              canRead: body.permissions?.canRead || false,
              canWrite: body.permissions?.canWrite || false,
              canDelete: body.permissions?.canDelete || false,
              canUpdate: body.permissions?.canUpdate || false,
            },
            modelName: body.modelName || 'unknown',
            tokenUsage: {
              inputTokens: body.tokenUsage?.inputTokens || 0,
              outputTokens: body.tokenUsage?.outputTokens || 0,
            },
            temperature: body.temperature || 0.7,
            maxTokens: body.maxTokens || 1000,  // Default max tokens
            clientId: body.clientId || 'unknown',
            pageUrl: body.pageUrl || 'unknown',
            componentName: body.componentName || 'unknown',
            errorCode: body.errorCode || 'unknown',
            errorCategory: body.errorCategory || 'processing',
            retryCount: body.retryCount || 0,
          },
        });

        return NextResponse.json(
          { error: 'Failed to process analytics data' },
          { status: 500 }
        );


      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {

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
  output?: string;
  success?: boolean;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  queryId?: string;
  line_graph_data?: object[];
  pie_graph_data?: object[];
  metric_headers?: object[];
}

async function parseLLMResponse(data: WebhookRequest): Promise<ParsedLLMResponse> {
  return {
    output: data.output,
    success: data.success,
    status: data.status,
    queryId: data.queryId,
    line_graph_data: data.line_graph_data,
    pie_graph_data: data.pie_graph_data,
    metric_headers: data.metric_headers
  };
}