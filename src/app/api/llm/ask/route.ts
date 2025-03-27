import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Define the request schema
const QueryRequestSchema = z.object({
  prompt: z.string().min(1),
});

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