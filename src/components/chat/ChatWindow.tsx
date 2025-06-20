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
 * - Markdown content rendering
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
import { Message as MessageComponent } from './Message';
import { LoadingIndicator } from './LoadingIndicator';
import { Message as MessageType, MessageStatus } from '@/types/chat';

/**
 * Props for the ChatWindow component.
 * @property {Message[]} messages - Array of messages to display
 * @property {boolean} isLoading - Whether a response is currently being generated
 * @property {string} gaAccountId - Google Analytics account ID
 * @property {string} gaPropertyId - Google Analytics property ID
 * @property {function} onRateMessage - Function to rate a message
 */
interface ChatWindowProps {
  messages: MessageType[];
  isLoading?: boolean;
  gaAccountId?: string;
  gaPropertyId?: string;
  onRateMessage?: (messageId: string, rating: -1 | 1) => void;
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
export function ChatWindow({ messages, isLoading, gaAccountId, gaPropertyId, onRateMessage }: ChatWindowProps) {
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
          <MessageComponent
            key={message.id}
            {...message}
            onRate={onRateMessage}
          />
        ))}
        {/* {isLoading && (
          <LoadingIndicator message="Loading messages" />
        )} */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
} 