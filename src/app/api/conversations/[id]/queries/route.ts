import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Maximum time to wait for immediate response (3 seconds)
const IMMEDIATE_TIMEOUT = 3000;

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch queries for the conversation
    const queries = await prisma.query.findMany({
      where: {
        conversationId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        content: true,
        response: true,
        status: true,
        createdAt: true,
      },
    });

    // Format queries to match the Message interface
    const messages = queries.flatMap(query => {
      const messages = [];
      
      // Add user query
      messages.push({
        id: `${query.id}-query`,
        content: query.content,
        role: 'user' as const,
        timestamp: query.createdAt.toLocaleString(),
        status: query.status === 'IN_PROGRESS' ? 'processing' : undefined
      });

      // Add assistant response if it exists
      if (query.response && query.status === 'COMPLETED') {
        messages.push({
          id: `${query.id}-response`,
          content: query.response,
          role: 'assistant' as const,
          timestamp: query.createdAt.toLocaleString(),
        });
      }

      return messages;
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching conversation queries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get the message content from the request body
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create the query first
    const query = await prisma.query.create({
      data: {
        content,
        status: 'PENDING',
        userId: user.id,
        conversationId: id,
      },
    });

    if (!process.env.LLM_SERVICE_URL) {
      throw new Error('LLM_SERVICE_URL is not configured');
    }

    // Send request directly to LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: content,
        queryID: query.id,
        conversationID: id,
        dateToday: new Date().toISOString(),
        accountGA4: 'default',
        propertyGA4: 'default'
      }),
    });

    const data = await llmResponse.json();
    console.log('LLM service response:', data);

    if (!llmResponse.ok) {
      // Update query status to FAILED
      await prisma.query.update({
        where: { id: query.id },
        data: { 
          status: 'FAILED',
          response: `Error: LLM service responded with status ${llmResponse.status}: ${JSON.stringify(data)}`
        },
      });

      return NextResponse.json(
        { error: data.error || 'Failed to process message' },
        { status: llmResponse.status }
      );
    }

    // If we get an immediate response
    if (data.status === 'COMPLETED' && data.response) {
      await prisma.query.update({
        where: { id: query.id },
        data: {
          status: 'COMPLETED',
          response: data.response
        },
      });
    } else {
      // Mark as in progress if the response will be async
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
          userId: user.id,
        },
      });
    }

    return NextResponse.json({
      queryId: query.id,
      status: data.status || 'IN_PROGRESS',
      response: data.response,
    });
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 