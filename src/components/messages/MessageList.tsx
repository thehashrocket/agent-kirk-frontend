import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

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
  
  const form = useForm<MessageFormData>({
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

      form.reset();
      setFiles([]);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  const renderMessage = (message: Message, depth: number = 0) => (
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
        {message.attachments.length > 0 && (
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
            onClick={() => setReplyingTo(message.id)}
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
      {message.replies.map((reply) => renderMessage(reply as Message, depth + 1))}
    </div>
  );

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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border-t">
          <div className="flex flex-col gap-4">
            {replyingTo && (
              <div className="text-sm text-muted-foreground">
                Replying to a message
              </div>
            )}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <Label htmlFor="attachments">Attachments</Label>
              <FormControl>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </FormControl>
            </FormItem>
            
            <div className="flex gap-2">
              <Button type="submit">
                Send Message
              </Button>
              {replyingTo && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel Reply
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 