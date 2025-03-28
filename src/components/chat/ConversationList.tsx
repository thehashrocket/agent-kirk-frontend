/**
 * @file src/components/chat/ConversationList.tsx
 * Conversation list component that provides searchable and interactive chat history.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Real-time search filtering
 * - Star/unstar conversations
 * - Scrollable conversation list
 * - Active conversation highlighting
 * - Responsive design
 * 
 * Layout:
 * - Search input at the top
 * - Scrollable list of conversations
 * - Each conversation shows title, last message, and timestamp
 * - Star button for bookmarking
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bookmark, BookmarkCheck, BookmarkPlus, BookmarkMinus } from 'lucide-react';
import { NewConversationButton } from './NewConversationButton';

/**
 * Interface for conversation data.
 * @property {string} id - Unique identifier for the conversation
 * @property {string} title - Display title for the conversation
 * @property {string} lastMessage - Most recent message in the conversation
 * @property {string} timestamp - Human-readable timestamp
 * @property {boolean} isStarred - Whether the conversation is bookmarked
 */
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isStarred: boolean;
}

/**
 * Interface for conversation creation data.
 * @property {string} title - Display title for the conversation
 * @property {string} gaAccountId - Google Analytics account ID
 * @property {string} gaPropertyId - Google Analytics property ID
 */
interface ConversationCreateData {
  title: string;
  gaAccountId?: string;
  gaPropertyId?: string;
}

/**
 * Interface for Google Analytics property data.
 * @property {string} id - Unique identifier for the Google Analytics property
 * @property {string} gaPropertyId - Google Analytics property ID
 * @property {string} gaPropertyName - Display name for the Google Analytics property
 */
interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

/**
 * Interface for Google Analytics account data.
 * @property {string} id - Unique identifier for the Google Analytics account
 * @property {string} gaAccountId - Google Analytics account ID
 * @property {string} gaAccountName - Display name for the Google Analytics account
 * @property {GaProperty[]} gaProperties - Array of Google Analytics property items
 */
interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

/**
 * Props for the ConversationList component.
 * @property {Conversation[]} conversations - Array of conversation items to display
 * @property {string} selectedId - ID of the currently selected conversation
 * @property {function} onSelect - Callback when a conversation is selected
 * @property {function} onToggleStar - Callback when a conversation's star status is toggled
 * @property {function} onCreateConversation - Callback when a new conversation is created
 * @property {boolean} isLoading - Whether the conversation creation is in progress
 * @property {GaAccount[]} gaAccounts - Array of Google Analytics account items to display
 */
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => Promise<void>;
  onCreateConversation: (data: ConversationCreateData) => Promise<void>;
  isLoading?: boolean;
  gaAccounts: GaAccount[];
}

/**
 * @component ConversationList
 * Client Component that renders a searchable list of chat conversations.
 * 
 * Features:
 * - Real-time search filtering of conversations
 * - Star/unstar functionality for bookmarking
 * - Active conversation highlighting
 * - Scrollable conversation list
 * - Responsive design
 * 
 * Layout:
 * - Fixed search input at top
 * - Scrollable list below
 * - Each conversation shows:
 *   - Title
 *   - Last message preview
 *   - Timestamp
 *   - Star button
 * 
 * Accessibility:
 * - Proper ARIA labels for interactive elements
 * - Keyboard navigation support
 * - Clear visual hierarchy
 * - Proper focus management
 */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onToggleStar,
  onCreateConversation,
  isLoading,
  gaAccounts,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-2 p-4 border-b">
        <NewConversationButton
          onCreateConversation={onCreateConversation}
          isLoading={isLoading}
          gaAccounts={gaAccounts}
        />
        <Input
          type="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          aria-label="Search conversations"
        />
      </div>
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4" role="listbox" aria-label="Conversations">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(conversation.id);
                }
              }}
              role="option"
              tabIndex={0}
              className={cn(
                'flex w-full flex-col items-start rounded-lg px-4 py-2 text-left transition-colors',
                selectedId === conversation.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              )}
              aria-selected={selectedId === conversation.id}
              aria-label={`Conversation: ${conversation.title}`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium">{conversation.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(conversation.id);
                  }}
                  className="text-muted-foreground hover:text-yellow-400"
                  aria-label={conversation.isStarred ? 'Remove bookmark' : 'Add bookmark'}
                >
                  {conversation.isStarred ? (
                    hoveredId === conversation.id ? (
                      <BookmarkMinus className="h-4 w-4" />
                    ) : (
                      <BookmarkCheck className="h-4 w-4" />
                    )
                  ) : (
                    hoveredId === conversation.id ? (
                      <BookmarkPlus className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )
                  )}
                </button>
              </div>
              <span className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {conversation.lastMessage}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {conversation.timestamp}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 