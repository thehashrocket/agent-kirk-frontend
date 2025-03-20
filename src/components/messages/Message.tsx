/**
 * @file src/components/messages/Message.tsx
 * Individual message component that handles displaying a message, its replies,
 * and reply functionality. Uses React Query for data fetching.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { InlineReply } from './InlineReply';

interface MessageProps {
  messageId: string;
  depth?: number;
  currentUserId?: string;
  onReplyComplete?: () => void;
}

export function Message({ messageId, depth = 0, currentUserId, onReplyComplete }: MessageProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const { data: message, isLoading } = useQuery({
    queryKey: ['message', messageId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${messageId}`);
      if (!response.ok) throw new Error('Failed to fetch message');
      return response.json();
    },
  });

  const handleReplyComplete = () => {
    setIsReplying(false);
    setShowReplies(true);
    onReplyComplete?.();
  };

  const hasReplies = message?.replies && message.replies.length > 0;
  const isReply = message?.parentId !== null;

  if (isLoading || !message) {
    return <div className="text-center text-muted-foreground">Loading message...</div>;
  }

  return (
    <div className="space-y-4">
      <Card
        className={`p-4 ${message.senderId === currentUserId
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
            {message.attachments.map((attachment: { id: string; filename: string; url: string }) => (
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
            onClick={() => setIsReplying(!isReplying)}
          >
            Reply
          </Button>
          {hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="gap-1"
            >
              {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showReplies ? 'Hide Replies' : 'Show Replies'}
            </Button>
          )}
        </div>
      </Card>

      {isReplying && (
        <InlineReply
          recipientId={message.sender.id}
          parentMessageId={message.id}
          onReplyComplete={handleReplyComplete}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {showReplies && hasReplies && (
        <div className="space-y-4 mt-2">
          {message.replies.map((reply: { id: string }) => (
            <Message
              key={reply.id}
              messageId={reply.id}
              depth={depth + 1}
              currentUserId={currentUserId}
              onReplyComplete={onReplyComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 