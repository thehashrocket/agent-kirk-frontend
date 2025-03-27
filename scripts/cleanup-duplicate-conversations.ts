import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateDuplicateConversations() {
  try {
    // Get all conversations grouped by title and user
    const conversations = await prisma.conversation.groupBy({
      by: ['title', 'userId'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    console.log(`Found ${conversations.length} groups of duplicate conversations`);

    for (const group of conversations) {
      // Get all conversations with this title and user
      const duplicates = await prisma.conversation.findMany({
        where: {
          title: group.title,
          userId: group.userId,
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
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Update titles to include context or timestamp if needed
      for (let i = 0; i < duplicates.length; i++) {
        const conv = duplicates[i];
        if (i > 0) { // Don't modify the most recent one
          const timestamp = conv.updatedAt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          });
          
          // If the conversation has a query, use it for context
          const contextTitle = conv.queries[0]?.content
            ? `${conv.title} (${conv.queries[0].content.slice(0, 30)}...)`
            : `${conv.title} (${timestamp})`;

          console.log(`Updating conversation "${conv.title}" to "${contextTitle}"`);
          
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { title: contextTitle },
          });
        }
      }
    }

    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDuplicateConversations(); 