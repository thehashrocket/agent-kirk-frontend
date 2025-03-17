import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

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

type MessageFormData = z.infer<typeof messageSchema>;

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
  attachments: Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }>;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  recipient: {
    id: string;
    name: string | null;
    image: string | null;
  };
  parent?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  };
  replies: Array<{
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  }>;
}

interface MessageListProps {
  recipientId: string;
  threadId?: string;
}

export function MessageList({ recipientId, threadId }: MessageListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { ref, inView } = useInView();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema)
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
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

  const onSubmit = async (data: MessageFormData) => {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('recipientId', recipientId);
      if (replyingTo) {
        formData.append('parentId', replyingTo);
      }
      
      if (files.length > 0) {
        for (const file of files) {
          formData.append('attachments', file);
        }
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send message');

      reset();
      setFiles([]);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const renderMessage = (message: Message, depth: number = 0) => (
    <div key={message.id} className="space-y-4">
      <div
        className={`p-4 rounded-lg ${
          message.senderId === recipientId
            ? 'bg-blue-100 ml-auto'
            : 'bg-gray-100'
        } max-w-[70%]`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex items-center gap-2 mb-2">
          {message.sender.image && (
            <Image
              src={message.sender.image}
              alt={message.sender.name || 'User'}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <span className="font-semibold">
            {message.sender.name || 'Unknown User'}
          </span>
        </div>
        {message.parent && (
          <div className="text-sm text-gray-600 mb-2 border-l-2 border-gray-300 pl-2">
            <span className="font-medium">{message.parent.sender.name}</span> wrote:
            <p className="mt-1">{message.parent.content}</p>
          </div>
        )}
        <p className="text-gray-800">{message.content}</p>
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {attachment.filename}
              </a>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setReplyingTo(message.id)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
          {message.isThreadStart && (
            <button
              onClick={() => window.location.href = `?threadId=${message.threadId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Thread
            </button>
          )}
        </div>
      </div>
      {message.replies.map((reply) => renderMessage(reply as Message, depth + 1))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data?.pages.map((page: { messages: Message[] }, i: number) => (
          <div key={i} className="space-y-4">
            {page.messages.map((message) => renderMessage(message))}
          </div>
        ))}
        <div ref={ref}>
          {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load more' : ''}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t">
        <div className="flex flex-col gap-4">
          {replyingTo && (
            <div className="text-sm text-gray-600">
              Replying to a message
            </div>
          )}
          <textarea
            {...register('content')}
            className="w-full p-2 border rounded-lg"
            placeholder="Type your message..."
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
          
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="text-sm"
          />
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Send Message
            </button>
            {replyingTo && (
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel Reply
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 