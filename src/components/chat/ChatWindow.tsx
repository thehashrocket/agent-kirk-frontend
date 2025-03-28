/**
 * @file src/components/chat/ChatWindow.tsx
 * Chat window component that displays the message history between user and AI.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Message history display
 * - Role-based message styling
 * - Auto-scroll to latest message
 * - Loading state indicator
 * - Responsive design
 * 
 * Layout:
 * - Scrollable message container
 * - Messages aligned based on role (user/assistant)
 * - Loading indicator for pending responses
 * - Timestamps for each message
 */

'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Interface for message data.
 * @property {string} id - Unique identifier for the message
 * @property {string} content - Message content text
 * @property {'user' | 'assistant'} role - Role of the message sender
 * @property {string} timestamp - Human-readable timestamp
 * @property {string} status - Status of the message
 */
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'processing' | 'completed' | 'error';
}

/**
 * Props for the ChatWindow component.
 * @property {Message[]} messages - Array of messages to display
 * @property {boolean} isLoading - Whether a response is currently being generated
 * @property {string} gaAccountId - Google Analytics account ID
 * @property {string} gaPropertyId - Google Analytics property ID
 */
interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  gaAccountId?: string;
  gaPropertyId?: string;
}

/**
 * @component ChatWindow
 * Client Component that renders the chat message history.
 * 
 * Features:
 * - Automatic scrolling to latest message
 * - Role-based message styling
 * - Loading state animation
 * - Responsive design
 * 
 * Layout:
 * - Full-height scrollable container
 * - Messages grouped by sender
 * - User messages aligned right
 * - Assistant messages aligned left
 * - Loading indicator at bottom when active
 * 
 * Accessibility:
 * - Semantic message structure
 * - Clear visual hierarchy
 * - Proper contrast for readability
 * - Proper ARIA roles
 */
export function ChatWindow({ messages, isLoading, gaAccountId, gaPropertyId }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col space-y-4 p-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex w-full max-w-2xl items-start space-x-4 rounded-lg p-4',
              message.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
            role={message.role === 'assistant' ? 'article' : 'complementary'}
            aria-label={`${message.role} message`}
          >
            <div className="flex-1 space-y-2">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.status === 'processing' && (
                <div className="flex items-center space-x-2 text-xs opacity-70">
                  <span>Processing response</span>
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <p className="text-xs opacity-70">{message.timestamp}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div 
            className="flex w-full max-w-2xl items-center space-x-4 rounded-lg bg-muted p-4"
            role="status"
            aria-label="Loading messages"
          >
            <div className="space-y-2">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
} 