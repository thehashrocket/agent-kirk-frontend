/**
 * @file src/app/api/llm/chat/status/route.ts
 * LLM Chat Status API Route
 * 
 * This API endpoint provides status information for ongoing LLM chat queries.
 * It allows clients to check the status, response, and time elapsed for a specific query.
 * 
 * @route GET /api/llm/chat/status
 * @access Private - Requires authenticated user
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Zod schema for validating status request parameters
 */
const StatusRequestSchema = z.object({
  queryId: z.string(),
});

/**
 * Response structure for chat status
 */
type StatusResponse = {
  queryId: string;
  status: string;
  response: string | null;
  timeElapsed: number;
};

/**
 * GET handler for retrieving chat query status
 * 
 * @param {NextRequest} request - The incoming request object containing queryId in searchParams
 * @returns {Promise<NextResponse<StatusResponse | { error: string }>>} JSON response containing query status or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If queryId is missing or invalid
 * @throws {404} If query is not found or doesn't belong to user
 * @throws {500} If there's an internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
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