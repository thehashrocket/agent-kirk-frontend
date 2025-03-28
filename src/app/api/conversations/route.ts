import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Prisma, PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        queries: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            content: true,
          },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[CONVERSATION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id, isStarred } = await request.json();
    if (!id) {
      return new NextResponse('Conversation ID is required', { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return new NextResponse('Not found', { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { isStarred },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[CONVERSATION_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title, gaAccountId, gaPropertyId } = await request.json();
    if (!title) {
      return new NextResponse('Title is required', { status: 400 });
    }

    // Create a new conversation with the given title and optional GA fields
    const conversation = await prisma.conversation.create({
      data: {
        title,
        userId: session.user.id,
        ...(gaAccountId ? { gaAccountId } : {}),
        ...(gaPropertyId ? { gaPropertyId } : {}),
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('[CONVERSATION_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 