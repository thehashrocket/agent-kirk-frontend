import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  isRead: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Check if user has permission to update this message
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        recipientId: true,
        senderId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only recipient can mark as read, both sender and recipient can archive
    if (validatedData.isRead && message.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (message.recipientId !== session.user.id && message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: validatedData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 