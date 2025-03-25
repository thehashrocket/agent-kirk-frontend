'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { TagSelector } from '@/components/chat/TagSelector';
import { SourcesButton } from '@/components/chat/SourcesButton';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockConversations = [
  {
    id: '1',
    title: 'Getting started with Next.js',
    lastMessage: 'How do I create a new Next.js project?',
    timestamp: '2 hours ago',
    isStarred: true,
  },
  {
    id: '2',
    title: 'Tailwind CSS setup',
    lastMessage: 'What are the best practices for Tailwind CSS?',
    timestamp: '5 hours ago',
    isStarred: false,
  },
];

const mockMessages = [
  {
    id: '1',
    content: 'How do I create a new Next.js project?',
    role: 'user' as const,
    timestamp: '2:30 PM',
  },
  {
    id: '2',
    content: 'To create a new Next.js project, you can use the following command:\n\n```bash\npnpm create next-app@latest\n```\n\nThis will guide you through the setup process where you can choose your preferences for TypeScript, ESLint, and other features.',
    role: 'assistant' as const,
    timestamp: '2:31 PM',
  },
];

const mockSuggestedResponses = [
  { id: '1', text: 'What features should I enable?' },
  { id: '2', text: 'How do I add Tailwind CSS?' },
  { id: '3', text: 'Can you explain the file structure?' },
];

const mockTags = [
  { id: '1', name: 'Next.js' },
  { id: '2', name: 'Setup' },
];

const mockSources = [
  {
    id: '1',
    title: 'Next.js Documentation - Installation',
    url: 'https://nextjs.org/docs/getting-started/installation',
    relevance: 0.95,
  },
  {
    id: '2',
    title: 'Create Next App Documentation',
    url: 'https://nextjs.org/docs/api-reference/create-next-app',
    relevance: 0.85,
  },
];

export default function ChatPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(mockConversations[0].id);
  const [selectedTags, setSelectedTags] = useState(mockTags);

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile header with menu button */}
      <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium"
          aria-label="Toggle conversation list"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <div className="flex items-center space-x-2">
          <TagSelector
            selectedTags={selectedTags}
            onAddTag={(tag) => setSelectedTags([...selectedTags, tag])}
            onRemoveTag={(tagId) =>
              setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId))
            }
          />
          <SourcesButton sources={mockSources} />
        </div>
      </div>

      {/* Mobile menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <ConversationList
            conversations={mockConversations}
            selectedId={selectedConversation}
            onSelect={(id) => {
              setSelectedConversation(id);
              setIsMobileMenuOpen(false);
            }}
            onToggleStar={(id) =>
              console.log('Toggle star for conversation:', id)
            }
          />
        </SheetContent>
      </Sheet>

      {/* Desktop conversation list */}
      <div 
        className={cn(
          "hidden md:flex flex-col border-r transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-80"
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-14 items-center justify-center border-b hover:bg-muted transition-colors"
          aria-label={isCollapsed ? "Expand conversation list" : "Collapse conversation list"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-6 w-6 transition-transform duration-300",
              isCollapsed ? "rotate-180" : ""
            )}
          >
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className={cn(
          "flex-1 transition-opacity duration-300",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}>
          <ConversationList
            conversations={mockConversations}
            selectedId={selectedConversation}
            onSelect={setSelectedConversation}
            onToggleStar={(id) => console.log('Toggle star for conversation:', id)}
          />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <div className="hidden items-center justify-end border-b p-4 md:flex">
          <div className="flex items-center space-x-2">
            <TagSelector
              selectedTags={selectedTags}
              onAddTag={(tag) => setSelectedTags([...selectedTags, tag])}
              onRemoveTag={(tagId) =>
                setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId))
              }
            />
            <SourcesButton sources={mockSources} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatWindow messages={mockMessages} />
        </div>
        <div className="border-t p-4">
          <ChatInput
            onSend={handleSendMessage}
            suggestedResponses={mockSuggestedResponses}
          />
        </div>
      </div>
    </div>
  );
} 