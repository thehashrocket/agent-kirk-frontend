import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Define the webhook request schema
const WebhookRequestSchema = z.object({
  queryId: z.string().min(1, "Query ID is required"),
  response: z.string().optional(),
  error: z.string().optional(),
}).refine(data => data.response || data.error, {
  message: "Either response or error must be provided"
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the webhook payload
    const body = await request.json();
    console.log('Webhook received body:', body);

    // Get query ID from multiple possible sources
    let queryId = body.queryId || request.headers.get('x-query-id') || '';
    
    // Log all potential sources of query ID
    console.log('Query ID sources:', {
      bodyQueryId: body.queryId,
      headerQueryId: request.headers.get('x-query-id'),
      finalQueryId: queryId
    });

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

    // Construct validated data object
    const validatedData = {
      queryId,
      response: body.response,
      error: body.error || body.message // Accept error from either field
    };

    // Validate the data
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

    // Get the query from database
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

    if (validatedData.error) {
      // Update query status to failed
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'FAILED',
          response: validatedData.error,
        },
      });

      // Create error notification
      await prisma.notification.create({
        data: {
          type: 'QUERY_COMPLETE',
          title: 'Query Failed',
          content: 'Your query could not be processed. Please try again.',
          userId: query.userId,
        },
      });
    } else if (validatedData.response) {
      // Update query with response
      await prisma.query.update({
        where: { id: validatedData.queryId },
        data: {
          status: 'COMPLETED',
          response: validatedData.response,
        },
      });

      // Create success notification
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 