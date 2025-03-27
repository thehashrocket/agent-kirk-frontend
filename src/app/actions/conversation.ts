'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function createConversation(title: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const conversation = await prisma.conversation.create({
    data: {
      title,
      userId: session.user.id,
    },
  });

  revalidatePath('/chat');
  return conversation;
}

export async function toggleConversationStar(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: { isStarred: !conversation.isStarred },
  });

  revalidatePath('/chat');
  return updated;
} 