/**
 * @file src/components/messages/MessageList.tsx
 * Message list component that provides a threaded conversation view with infinite scrolling,
 * file attachments, and reply functionality. Uses shadcn/ui components for the UI.
 */

'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { InlineReply } from './InlineReply';
import { z } from 'zod';

/**
 * Zod schema for message form validation.
 * Validates message content, recipient, optional parent message, and attachments.
 */
const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  recipientId: z.string(),
  parentId: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    fileSize: z.number().max(10 * 1024 * 1024),
    mimeType: z.string(),
    url: z.string().url()
  })).optional()
});

/**
 * Type definition for message form data derived from the Zod schema.
 */
type MessageFormData = z.infer<typeof messageSchema>;

/**
 * Interface representing a message in the system.
 * Includes message content, metadata, sender/recipient info, attachments,
 * and thread-related data.
 */
interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  parentId: string | null;
  threadId: string | null;
  isThreadStart: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }>;
  sender: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  recipient: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  parent?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  };
  replies?: Array<{
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  }>;
}

/**
 * Props for the MessageList component.
 * @property {string} [recipientId] - Optional ID of the message recipient (required for inbox view)
 * @property {string} [threadId] - Optional thread ID for viewing specific conversation threads
 */
interface MessageListProps {
  recipientId?: string;
  threadId?: string;
}

/**
 * @component MessageList
 * @path src/components/messages/MessageList.tsx
 * Displays a list of messages in a threaded conversation view.
 * Features:
 * - Infinite scrolling message list
 * - File attachments support
 * - Message threading with replies
 * - Real-time message status (read/unread)
 * - Message composition with form validation
 * - Responsive layout with proper message alignment
 * 
 * @param {MessageListProps} props - Component props
 */
export function MessageList({ recipientId, threadId }: MessageListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery<{
    messages: Message[];
    pagination: { page: number; totalPages: number };
  }>({
    queryKey: ['messages', recipientId, threadId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/messages?page=${pageParam}&limit=20${threadId ? `&threadId=${threadId}` : ''}`);
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Handles message form submission.
   * Processes message content and attachments, sends to API.
   * @param {MessageFormData} data - Form data including message content and metadata
   */
  const onSubmit = async (data: MessageFormData) => {
    try {
      // Convert files to attachments
      const attachments = await Promise.all(
        files.map(async file => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            url: base64,
          };
        })
      );

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          parentId: replyingTo,
          attachments,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setFiles([]);
      setReplyingTo(null);
      refetch();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  /**
   * Renders a single message with its replies.
   * Handles message styling, attachments, and reply actions.
   * @param {Message} message - Message object to render
   * @param {number} depth - Nesting depth for reply indentation
   */
  const renderMessage = (message: Message, depth: number = 0) => {
    console.log('Rendering message:', {
      messageId: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId
    });

    return (
      <div key={message.id} className="space-y-4">
        <Card
          className={`p-4 ${
            message.senderId === recipientId
              ? 'bg-primary/10 ml-auto'
              : 'bg-muted'
          } max-w-[70%]`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8">
              {message.sender.image && (
                <AvatarImage src={message.sender.image} alt={message.sender.name || 'User'} />
              )}
              <AvatarFallback>
                {message.sender.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">
              {message.sender.name || 'Unknown User'}
            </span>
            {!message.isRead && (
              <Badge variant="secondary">New</Badge>
            )}
          </div>
          {message.parent && (
            <Card className="text-sm text-muted-foreground mb-2 border-l-2 border-muted pl-2">
              <span className="font-medium">{message.parent.sender.name}</span> wrote:
              <p className="mt-1">{message.parent.content}</p>
            </Card>
          )}
          <p className="text-foreground">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <Button
                  key={attachment.id}
                  variant="link"
                  className="p-0 h-auto"
                  asChild
                >
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {attachment.filename}
                  </a>
                </Button>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Reply clicked:', {
                  messageId: message.id,
                  senderId: message.sender.id,
                  recipientId: message.recipientId
                });
                setReplyingTo(message.id);
              }}
            >
              Reply
            </Button>
            {message.isThreadStart && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = `?threadId=${message.threadId}`}
              >
                View Thread
              </Button>
            )}
          </div>
        </Card>
        {replyingTo === message.id && (
          <InlineReply
            recipientId={message.sender.id}
            parentMessageId={message.id}
            onReplyComplete={() => {
              console.log('Reply complete:', {
                messageId: message.id,
                senderId: message.sender.id,
                recipientId: message.recipientId
              });
              setReplyingTo(null);
              refetch();
            }}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        {message.replies && message.replies.map((reply) => {
          const replyMessage: Message = {
            ...reply,
            senderId: reply.sender.id,
            recipientId: message.senderId,
            isRead: true,
            createdAt: message.createdAt,
            parentId: message.id,
            threadId: message.threadId,
            isThreadStart: false,
            sender: reply.sender,
            recipient: {
              id: message.senderId,
              name: message.sender.name,
              image: message.sender.image
            }
          };
          return renderMessage(replyMessage, depth + 1);
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {data?.pages.map((page: { messages: Message[] }, i: number) => (
            <div key={i} className="space-y-4">
              {page.messages.map((message) => renderMessage(message))}
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