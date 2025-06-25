/**
 * @file src/components/chat/Message.tsx
 * Individual message component that handles message content and rating UI.
 */

'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from './MessageContent';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { LoadingDots } from './LoadingDots';
import { MessageStatus, MESSAGE_STATUS } from '@/types/chat';

// Lazy load the chart modal to prevent unnecessary renders
const ChartPreviewModal = lazy(() => import('./ChartPreviewModal').then(mod => ({ default: mod.ChartPreviewModal })));

function LazyChartPreviewModal({ queryId }: { queryId: string }) {
  return (
    <Suspense fallback={<div className="text-xs text-muted-foreground">Loading charts...</div>}>
      <ChartPreviewModal queryId={queryId} />
    </Suspense>
  );
}

const FUNNY_PROCESSING_MESSAGES = [
  "Consulting my crystal ball...",
  "Teaching AI to count to infinity...",
  "Brewing the perfect response...",
  "Asking the rubber duck for advice...",
  "Channeling my inner Einstein...",
  "Calculating the meaning of life...",
  "Translating from human to awesome...",
  "Performing digital gymnastics...",
  "Convincing electrons to cooperate...",
  "Summoning the algorithm spirits...",
  "Debugging reality.exe...",
  "Optimizing my thinking cap...",
  "Consulting the digital oracle...",
  "Spinning up the hamster wheels...",
  "Downloading more RAM for thoughts...",
  "Calibrating my sarcasm detector...",
  "Polishing my virtual neurons...",
  "Reticulating splines...",
  "Herding digital cats...",
  "Convincing my CPU to think faster..."
];

function useCyclingMessage(messages: string[], intervalMs = 2000) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  return messages[currentIndex];
}

interface MessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: MessageStatus;
  rating?: -1 | 0 | 1;
  onRate?: (messageId: string, rating: -1 | 1) => void;
}

export const Message = React.memo(function Message({
  id,
  content,
  role,
  timestamp,
  status,
  rating = 0,
  onRate
}: MessageProps) {
  const isUser = role === 'user';
  const shouldShowCharts = !isUser && status === MESSAGE_STATUS.COMPLETED;
  const currentProcessingMessage = useCyclingMessage(FUNNY_PROCESSING_MESSAGES, 2000);
  
  const containerClasses = cn(
    'flex w-full space-x-2',
    isUser ? 'justify-end' : 'justify-start'
  );

  const messageClasses = cn(
    'relative rounded-lg px-4 py-2 max-w-[80%]',
    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
    status === MESSAGE_STATUS.ERROR && 'bg-destructive text-destructive-foreground'
  );

  return (
    <div className={containerClasses}>
      <div className={messageClasses}>
        <MessageContent content={content} />
        
        {status === MESSAGE_STATUS.PROCESSING && (
          <div className="flex items-center space-x-2 text-xs opacity-70 mt-2">
            <span className="transition-opacity duration-300">
              {content || currentProcessingMessage}
            </span>
            <LoadingDots />
          </div>
        )}

        {status === MESSAGE_STATUS.ERROR && (
          <div className="text-xs text-destructive-foreground/70">
            Failed to process response
          </div>
        )}

        {shouldShowCharts && (
          <div className="mt-2">
            <LazyChartPreviewModal queryId={id} />
          </div>
        )}

        {!isUser && status === MESSAGE_STATUS.COMPLETED && onRate && (
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

        <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
          {timestamp}
        </div>
      </div>
    </div>
  );
});