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
  let query;
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
    query = await prisma.query.create({
      data: {
        content: validatedData.query,
        status: 'PENDING',
        userId: session.user.id,
        conversationId: validatedData.conversationID,
      },
    });

    // Send request to LLM service
    console.log('Sending request to LLM service:', {
      queryId: query.id,
      query: validatedData.query,
      userId: session.user.id,
      conversationId: validatedData.conversationID,
      accountGA4: validatedData.accountGA4,
      propertyGA4: validatedData.propertyGA4,
      dateToday: validatedData.dateToday,
    });

    const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_SERVICE_API_KEY}`,
        'X-Query-ID': query.id // Add query ID to headers as backup
      },
      body: JSON.stringify({
        queryId: query.id,
        query: validatedData.query,
        userId: session.user.id,
        conversationId: validatedData.conversationID,
        accountGA4: validatedData.accountGA4,
        propertyGA4: validatedData.propertyGA4,
        dateToday: validatedData.dateToday,
      }),
    });

    // Log the raw response for debugging
    const responseText = await llmResponse.text();
    console.log('LLM service response status:', llmResponse.status);
    console.log('LLM service raw response:', responseText);

    if (!llmResponse.ok) {
      let errorMessage = 'Internal server error';
      let errorDetails = {};
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } catch (e) {
        console.error('Failed to parse error response:', e);
        errorMessage = responseText || errorMessage;
      }

      console.error('LLM service error:', {
        status: llmResponse.status,
        message: errorMessage,
        details: errorDetails,
        queryId: query.id
      });
      
      // Update query status to failed with detailed error
      await prisma.query.update({
        where: { id: query.id },
        data: { 
          status: 'FAILED', 
          response: JSON.stringify({
            error: errorMessage,
            status: llmResponse.status,
            details: errorDetails
          })
        },
      });

      return NextResponse.json(
        { 
          error: errorMessage,
          queryId: query.id,
          status: 'FAILED',
          details: errorDetails
        },
        { status: llmResponse.status }
      );
    }

    // Parse the successful response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse success response:', e);
      throw new Error('Invalid response from LLM service');
    }

    // If we get an immediate response, update the query and return it
    if (responseData.response) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'COMPLETED',
          response: responseData.response,
        },
      });

      return NextResponse.json({
        status: 'COMPLETED',
        queryId: query.id,
        response: responseData.response,
      });
    }

    // If no immediate response but we have an error, handle it
    if (responseData.error) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'FAILED',
          response: responseData.error,
        },
      });

      return NextResponse.json({
        status: 'FAILED',
        queryId: query.id,
        error: responseData.error,
      });
    }

    // If no immediate response and no error, assume it's in progress
    return NextResponse.json({
      status: 'IN_PROGRESS',
      queryId: query.id,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Update query status to failed
    if (query?.id) {
      await prisma.query.update({
        where: { id: query.id },
        data: { 
          status: 'FAILED', 
          response: error instanceof Error ? error.message : 'Unknown error'  // Store error in response field since that's what our schema expects
        },
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 