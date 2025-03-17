import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Define the request schema
const LLMRequestSchema = z.array(
  z.object({
    query: z.string().min(1),
    accountGA4: z.string(),
    propertyGA4: z.string(),
    conversationID: z.string(),
    dateToday: z.string(),
  })
);

export async function POST(request: Request) {
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
    const validatedData = LLMRequestSchema.parse(body);

    // Create a database record for the request
    const llmRequest = await prisma.lLMRequest.create({
      data: {
        query: validatedData[0].query,
        accountGA4: validatedData[0].accountGA4,
        propertyGA4: validatedData[0].propertyGA4,
        conversationID: validatedData[0].conversationID,
        dateToday: new Date(validatedData[0].dateToday),
        userId: session.user.id,
      },
    });

    // Forward the request to the LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM service responded with status: ${llmResponse.status}`);
    }

    const responseData = await llmResponse.json();

    // Update the database record with the response
    await prisma.lLMRequest.update({
      where: { id: llmRequest.id },
      data: { response: JSON.stringify(responseData) },
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