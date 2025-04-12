/**
 * @file src/components/chat/Message.tsx
 * Individual message component that handles message content and rating UI.
 */

'use client';

import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { RatingButtons } from './RatingButtons';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { LoadingDots } from './LoadingDots';

interface MessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  rating?: -1 | 0 | 1;
  metadata?: {
    line_graph_data?: any[];
    pie_graph_data?: any[];
    metric_headers?: any[];
  };
  onRate?: (messageId: string, rating: -1 | 1) => void;
}

export function Message({
  id,
  content,
  role,
  timestamp,
  status,
  rating = 0,
  metadata,
  onRate
}: MessageProps) {
  const isUser = role === 'user';
  const containerClasses = cn(
    'flex w-full space-x-2',
    isUser ? 'justify-end' : 'justify-start'
  );

  const messageClasses = cn(
    'relative rounded-lg px-4 py-2 max-w-[80%]',
    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
    status === 'FAILED' && 'bg-destructive text-destructive-foreground'
  );

  return (
    <div className={containerClasses}>
      <div className={messageClasses}>
        <MessageContent content={content} />
        
        {status === 'IN_PROGRESS' && (
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <span>Processing response</span>
            <LoadingDots />
          </div>
        )}

        {status === 'FAILED' && (
          <div className="text-xs text-destructive-foreground/70">
            Failed to process response
          </div>
        )}

        {!isUser && status === 'COMPLETED' && onRate && (
          <div className="mt-2 flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRate(id, 1)}
              className={cn('hover:bg-primary/10', rating === 1 && 'text-primary')}
              aria-label="Rate response positively"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRate(id, -1)}
              className={cn('hover:bg-primary/10', rating === -1 && 'text-primary')}
              aria-label="Rate response negatively"
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {metadata && (
          <div className="mt-4">
            {/* Add visualization components here using metadata */}
          </div>
        )}

        <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
          {timestamp}
        </div>
      </div>
    </div>
  );
} 