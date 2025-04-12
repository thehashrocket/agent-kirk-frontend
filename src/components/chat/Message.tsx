/**
 * @file src/components/chat/Message.tsx
 * Individual message component that handles message content and rating UI.
 */

'use client';

import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { RatingButtons } from './RatingButtons';

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
  return (
    <div
      className={cn(
        'flex w-full max-w-2xl items-start space-x-4 rounded-lg p-4',
        role === 'user'
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted'
      )}
      role={role === 'assistant' ? 'article' : 'complementary'}
      aria-label={`${role} message`}
    >
      <div className="flex-1 space-y-2">
        <MessageContent content={content} />
        
        {status === 'IN_PROGRESS' && (
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <span>Processing response</span>
            <div className="flex space-x-1">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs opacity-70">{timestamp}</p>
          {role === 'assistant' && onRate && (
            <RatingButtons
              messageId={id}
              initialRating={rating}
              onRate={onRate}
            />
          )}
        </div>
      </div>
    </div>
  );
} 