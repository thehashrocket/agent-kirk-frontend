/**
 * @fileoverview API Route for fetching user's LLM query history
 * 
 * This route handles retrieving the authenticated user's LLM interaction history.
 * It requires authentication and returns a paginated list of past queries and responses.
 * 
 * @route GET /api/llm/history
 * @authentication Required
 * @returns {Promise<NextResponse>} JSON response containing an array of Query objects
 * 
 * @example Response
 * {
 *   id: string;
 *   content: string;
 *   response: string;
 *   createdAt: Date;
 *   conversationId: string;
 * }[]
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {404} Not Found - If authenticated user doesn't exist in database
 * @throws {500} Internal Server Error - If database query fails
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET handler for /api/llm/history
 * Retrieves the authenticated user's LLM query history
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const queries = await prisma.query.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        response: true,
        createdAt: true,
        conversationId: true
      }
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error('Error fetching query history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 