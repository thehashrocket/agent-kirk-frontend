import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
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
        conversationId: params.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        content: true,
        response: true,
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
      });

      // Add assistant response if it exists
      if (query.response) {
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
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
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

    // Create the new query
    const query = await prisma.query.create({
      data: {
        content,
        conversationId: params.id,
        userId: user.id,
      },
    });

    // Format and return the new message
    const message = {
      id: `${query.id}-query`,
      content: query.content,
      role: 'user' as const,
      timestamp: query.createdAt.toLocaleString(),
    };

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 