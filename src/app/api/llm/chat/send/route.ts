import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define the request schema
const ChatRequestSchema = z.object({
  query: z.string().min(1),
  accountGA4: z.string(),
  propertyGA4: z.string(),
  conversationID: z.string(),
  dateToday: z.string(),
});

// Maximum time to wait for immediate response (3 seconds)
const IMMEDIATE_TIMEOUT = 3000;

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    // Create a database record for the query
    const query = await prisma.query.create({
      data: {
        content: validatedData.query,
        status: 'PENDING',
        userId: session.user.id,
        conversationId: validatedData.conversationID,
      },
    });

    // Try to get an immediate response from LLM service with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMMEDIATE_TIMEOUT);

      const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Query-ID': query.id,
        },
        body: JSON.stringify({
          ...validatedData,
          queryID: query.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (llmResponse.ok) {
        const responseData = await llmResponse.json();

        // Update query with response
        await prisma.query.update({
          where: { id: query.id },
          data: {
            response: responseData.response,
            status: 'COMPLETED',
          },
        });

        return NextResponse.json({
          queryId: query.id,
          status: 'COMPLETED',
          response: responseData.response,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request timed out - update status to IN_PROGRESS
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
            userId: session.user.id,
          },
        });

        return NextResponse.json({
          queryId: query.id,
          status: 'IN_PROGRESS',
          estimatedTime: 300, // 5 minutes estimate
        });
      }
    }

    // If we reach here, something went wrong with the LLM service
    await prisma.query.update({
      where: { id: query.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json(
      { error: 'Failed to process query', queryId: query.id },
      { status: 500 }
    );
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 