/**
 * @file src/components/messages/MessageList.tsx
 * Message list component that provides a threaded conversation view with infinite scrolling.
 * Uses the Message component to handle individual message display and replies.
 */

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from './Message';

interface MessageListProps {
  recipientId?: string;
  threadId?: string;
  currentUserId?: string;
}

/**
 * @component MessageList
 * @path src/components/messages/MessageList.tsx
 * Displays a list of messages with infinite scrolling.
 * Each message is handled by the Message component.
 * 
 * @param {MessageListProps} props - Component props
 */
export function MessageList({ recipientId, threadId, currentUserId }: MessageListProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['messages', recipientId, threadId],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        view: 'inbox'  // Add view parameter
      });
      
      if (threadId) {
        params.append('threadId', threadId);
      }

      const response = await fetch(`/api/messages?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log('Messages response:', data);  // Debug log
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  // Load more messages when scrolling to the bottom
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {data?.pages.map((page, i) => (
            <div key={i} className="space-y-4">
              {page.messages.map((message: { id: string }) => (
                <Message
                  key={message.id}
                  messageId={message.id}
                  currentUserId={currentUserId}
                  onReplyComplete={refetch}
                />
              ))}
            </div>
          ))}
          <div ref={ref} className="text-center text-muted-foreground">
            {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load more' : ''}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
} 