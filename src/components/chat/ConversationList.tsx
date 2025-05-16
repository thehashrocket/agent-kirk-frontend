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
import ConversationTitle from './ConversationTitle';

/**
 * Interface for conversation data.
 * @property {string} id - Unique identifier for the conversation
 * @property {string} title - Display title for the conversation
 * @property {string} lastMessage - Most recent message in the conversation
 * @property {string} timestamp - Human-readable timestamp
 * @property {boolean} isStarred - Whether the conversation is bookmarked
 * @property {Client} client - Client information (optional)
 * @property {GaAccount} gaAccount - Google Analytics account information (optional)
 * @property {GaProperty} gaProperty - Google Analytics property information (optional)
 */
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isStarred: boolean;
  client?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  gaAccount?: {
    id: string;
    gaAccountId: string;
    gaAccountName: string;
  };
  gaProperty?: {
    id: string;
    gaPropertyId: string;
    gaPropertyName: string;
  };
}

/**
 * Interface for conversation creation data.
 * @property {string} title - Display title for the conversation
 * @property {string} gaAccountId - Google Analytics account ID
 * @property {string} gaPropertyId - Google Analytics property ID
 * @property {string} clientId - Client ID (for account reps)
 */
interface ConversationCreateData {
  title: string;
  gaAccountId?: string;
  gaPropertyId?: string;
  clientId?: string;
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
 * Interface for client data.
 * @property {string} id - Unique identifier for the client
 * @property {string} name - Display name for the client
 * @property {string} email - Email address of the client
 * @property {GaAccount[]} gaAccounts - Google Analytics accounts owned by this client
 */
interface Client {
  id: string;
  name: string | null;
  email: string | null;
  gaAccounts: GaAccount[];
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
 * @property {Client[]} clients - Array of client users (only used for account reps)
 */
interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => Promise<void>;
  onCreateConversation: (data: ConversationCreateData) => Promise<void>;
  isLoading?: boolean;
  gaAccounts: GaAccount[];
  clients?: Client[];
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
  clients,
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
          clients={clients}
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
                'flex w-full flex-col items-start rounded-lg px-1 py-1 text-left transition-colors',
                selectedId === conversation.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted'
              )}
              aria-selected={selectedId === conversation.id}
              aria-label={`Conversation: ${conversation.title}`}
            >
              <ConversationTitle
                title={conversation.title}
                timestamp={conversation.timestamp}
                isStarred={conversation.isStarred}
                onToggleStar={() => onToggleStar(conversation.id)}
                client={conversation.client}
                gaAccount={conversation.gaAccount}
                gaProperty={conversation.gaProperty}
                className="p-0"
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 