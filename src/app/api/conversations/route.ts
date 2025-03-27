import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

interface ConversationWithQueries {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: Date;
  queries: Array<{
    content: string;
  }>;
}

// Extend PrismaClient type to include our models
declare global {
  type ExtendedPrismaClient = PrismaClient & {
    conversation: {
      findMany: (args: any) => Promise<ConversationWithQueries[]>;
      findFirst: (args: any) => Promise<ConversationWithQueries | null>;
      update: (args: any) => Promise<ConversationWithQueries>;
    };
  };
}

// Cast prisma to our extended type
const extendedPrisma = prisma as ExtendedPrismaClient;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await extendedPrisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversations = await extendedPrisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        queries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format conversations to match the expected structure
    const formattedConversations = conversations.map((conv: ConversationWithQueries) => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.queries[0]?.content || '',
      timestamp: conv.updatedAt.toLocaleString(),
      isStarred: conv.isStarred,
    }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await extendedPrisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id, isStarred } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to the user
    const conversation = await extendedPrisma.conversation.findFirst({
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

    // Update the conversation
    const updatedConversation = await extendedPrisma.conversation.update({
      where: { id },
      data: { isStarred },
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 