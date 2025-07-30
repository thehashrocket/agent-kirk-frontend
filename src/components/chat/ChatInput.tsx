/**
 * @file src/components/chat/ChatInput.tsx
 * Chat input component that handles message composition and suggested responses.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Auto-expanding textarea
 * - Suggested response buttons
 * - Loading state handling
 * - Enter to send (with shift+enter for new line)
 * - Responsive design
 * 
 * Layout:
 * - Horizontally scrollable suggested responses
 * - Expandable input area
 * - Send button with loading state
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Interface for suggested response data.
 * @property {string} id - Unique identifier for the response
 * @property {string} text - Suggested response text
 */
interface SuggestedResponse {
  id: string;
  text: string;
}

/**
 * Props for the ChatInput component.
 * @property {function} onSend - Callback when a message is sent
 * @property {SuggestedResponse[]} suggestedResponses - Array of suggested responses
 * @property {boolean} isLoading - Whether a response is currently being processed
 */
interface ChatInputProps {
  onSend: (message: string) => void;
  suggestedResponses?: SuggestedResponse[];
  isLoading?: boolean;
}

/**
 * @component ChatInput
 * Client Component that renders the chat input area with suggested responses.
 * 
 * Features:
 * - Dynamic textarea height adjustment
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Suggested response selection
 * - Loading state handling
 * 
 * Layout:
 * - Horizontally scrollable suggested responses at top
 * - Expandable textarea with send button
 * - Responsive design for all screen sizes
 * 
 * Accessibility:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Clear button states
 * - Loading state indication
 */
export function ChatInput({
  onSend,
  suggestedResponses = [],
  isLoading,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {suggestedResponses.length > 0 && (
          <div className="flex space-x-2 p-1">
            {suggestedResponses.map((response) => (
              <Button
                key={response.id}
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  setMessage(response.text);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
                aria-label={`Use suggested response: ${response.text}`}
              >
                {response.text}
              </Button>
            ))}
          </div>
      )}
      <div className="flex space-x-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[60px] flex-1 resize-none"
          rows={1}
          aria-label="Message input"
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="h-auto"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
} 