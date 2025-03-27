'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { TagSelector } from '@/components/chat/TagSelector';
import { SourcesButton } from '@/components/chat/SourcesButton';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isStarred: boolean;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

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
  const [selectedTags, setSelectedTags] = useState(mockTags);
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      console.log('Raw conversation data length:', data.length);
      console.log('Raw conversation data:', data);
      
      // Format the conversations and ensure no duplicates by using a Map
      const conversationMap = new Map();
      data.forEach((conv: any) => {
        if (!conversationMap.has(conv.id)) {
          conversationMap.set(conv.id, {
            id: conv.id,
            title: conv.title,
            lastMessage: conv.queries[0]?.content || 'No messages yet',
            timestamp: new Date(conv.updatedAt).toLocaleString(),
            isStarred: conv.isStarred,
          });
        }
      });
      
      const formattedConversations = Array.from(conversationMap.values());
      console.log('Formatted conversations length:', formattedConversations.length);
      console.log('Formatted conversations:', formattedConversations);
      return formattedConversations;
    },
    staleTime: 5000, // Add a staleTime to prevent unnecessary refetches
  });

  // Initialize selected conversation
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(
    conversations[0]?.id
  );

  // Update selected conversation when conversations load
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const response = await fetch(`/api/conversations/${selectedConversation}/queries`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const newConversation = await response.json();
      return newConversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation.id);
      setIsMobileMenuOpen(false);
    },
  });

  // Star/unstar mutation
  const starMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isStarred }),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch messages for the current conversation
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation] });
      // Also update the conversations list to show the latest message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleCreateConversation = async (title: string) => {
    await createConversationMutation.mutate(title);
  };

  const handleToggleStar = async (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      starMutation.mutate({
        id,
        isStarred: !conversation.isStarred,
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedConversation) {
      // If no conversation is selected, create a new one first
      const newConversation = await createConversationMutation.mutateAsync('New Conversation');
      await sendMessageMutation.mutateAsync({
        conversationId: newConversation.id,
        message,
      });
    } else {
      // Send message in existing conversation
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversation,
        message,
      });
    }
  };

  if (isLoadingConversations) {
    return <div>Loading...</div>;
  }

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
            conversations={conversations}
            selectedId={selectedConversation}
            onSelect={(id) => {
              setSelectedConversation(id);
              setIsMobileMenuOpen(false);
            }}
            onToggleStar={handleToggleStar}
            onCreateConversation={handleCreateConversation}
            isLoading={createConversationMutation.isPending}
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
            conversations={conversations}
            selectedId={selectedConversation}
            onSelect={setSelectedConversation}
            onToggleStar={handleToggleStar}
            onCreateConversation={handleCreateConversation}
            isLoading={createConversationMutation.isPending}
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
          <ChatWindow messages={messages} isLoading={isLoadingMessages} />
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