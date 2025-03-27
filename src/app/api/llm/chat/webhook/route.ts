import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Define the webhook request schema
const WebhookRequestSchema = z.object({
  queryId: z.string(),
  response: z.string(),
  error: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the webhook payload
    const body = await request.json();
    const validatedData = WebhookRequestSchema.parse(body);

    // Get the query from database
    const query = await prisma.query.findUnique({
      where: { id: validatedData.queryId },
      include: { user: true },
    });

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
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
    } else {
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