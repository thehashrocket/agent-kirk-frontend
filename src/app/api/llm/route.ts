/**
 * @fileoverview LLM API Route Handler
 * 
 * This route handles LLM (Language Learning Model) query processing by:
 * 1. Validating incoming requests
 * 2. Storing queries in the database
 * 3. Forwarding requests to an external LLM service
 * 4. Updating the database with responses
 * 
 * @route POST /api/llm
 * @security Requires authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { QueryStatus } from '@/lib/validations/chat';

/**
 * Schema for individual LLM query requests
 * @typedef {Object} QueryRequest
 * @property {string} query - The LLM query text
 * @property {string} accountGA4 - Google Analytics 4 account identifier
 * @property {string} propertyGA4 - Google Analytics 4 property identifier
 * @property {string} conversationID - Unique identifier for the conversation
 * @property {string} dateToday - Current date in ISO format
 */
const QueryRequestSchema = z.array(
  z.object({
    query: z.string().min(1),
    accountGA4: z.string(),
    propertyGA4: z.string(),
    conversationID: z.string(),
    dateToday: z.string(),
  })
);

/**
 * Handles POST requests for LLM queries
 * 
 * @async
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with LLM results or error
 * @throws {Error} When LLM service fails or database operations fail
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
    const validatedData = QueryRequestSchema.parse(body);

    // Create a database record for the request
    const query = await prisma.query.create({
      data: {
        content: validatedData[0].query,
        status: 'PENDING' as QueryStatus,
        userId: session.user.id,
        response: '', // Will be updated after LLM response
      },
    });

    // Forward the request to the LLM service
    if (!process.env.LLM_SERVICE_URL) {
      throw new Error('LLM_SERVICE_URL is not configured');
    }

    const llmResponse = await fetch(process.env.LLM_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!llmResponse.ok) {
      // Update query status to FAILED if LLM service fails
      await prisma.query.update({
        where: { id: query.id },
        data: { 
          status: 'FAILED' as QueryStatus,
          response: `Error: LLM service responded with status: ${llmResponse.status}`
        },
      });
      throw new Error(`LLM service responded with status: ${llmResponse.status}`);
    }

    const responseData = await llmResponse.json();

    // Update the database record with the response
    await prisma.query.update({
      where: { id: query.id },
      data: { 
        status: 'COMPLETED' as QueryStatus,
        response: JSON.stringify(responseData) 
      },
    });
    
    return NextResponse.json(responseData);
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