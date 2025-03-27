import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Define the request schema
const StatusRequestSchema = z.object({
  queryId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get queryId from searchParams
    const searchParams = request.nextUrl.searchParams;
    const queryId = searchParams.get('queryId');

    if (!queryId) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      );
    }

    // Validate queryId
    StatusRequestSchema.parse({ queryId });

    // Get query status from database
    const query = await prisma.query.findUnique({
      where: {
        id: queryId,
        userId: session.user.id, // Ensure user can only access their own queries
      },
      select: {
        id: true,
        status: true,
        response: true,
        createdAt: true,
      },
    });

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    // Calculate time elapsed since query creation
    const timeElapsed = Date.now() - query.createdAt.getTime();
    const timeElapsedSeconds = Math.floor(timeElapsed / 1000);

    return NextResponse.json({
      queryId: query.id,
      status: query.status,
      response: query.response,
      timeElapsed: timeElapsedSeconds,
    });
  } catch (error) {
    console.error('Status API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query ID', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 