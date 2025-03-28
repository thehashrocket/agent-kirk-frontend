/**
 * @fileoverview API route handler for LLM query processing
 * 
 * This route handles user prompts sent to the LLM service. It:
 * - Validates user authentication
 * - Processes the prompt through a LLM service (currently mocked)
 * - Stores the query and response in the database
 * 
 * @route POST /api/llm/ask
 * @requires Authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * Zod schema for validating incoming query requests
 * @requires prompt - Non-empty string containing the user's query
 */
const QueryRequestSchema = z.object({
  prompt: z.string().min(1),
});

/**
 * Handles POST requests for LLM queries
 * 
 * @async
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing either the LLM response or error details
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If request data is invalid
 * @throws {500} If server encounters an error during processing
 * 
 * @example
 * POST /api/llm/ask
 * {
 *   "prompt": "What is the meaning of life?"
 * }
 */
export async function POST(
  request: NextRequest
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const { prompt } = QueryRequestSchema.parse(body);

    // Mock LLM response - replace this with actual LLM service call
    const mockResponse = `This is a mock response to your prompt: "${prompt}"`;

    // Store the query and response in the database
    await prisma.query.create({
      data: {
        userId: session.user.id,
        content: prompt,
        response: mockResponse,
      },
    });

    return NextResponse.json({ response: mockResponse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('LLM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 