'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { TagSelector } from '@/components/chat/TagSelector';
import { SourcesButton } from '@/components/chat/SourcesButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isStarred: boolean;
  gaAccountId?: string;
  gaPropertyId?: string;
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

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status?: 'processing' | 'completed' | 'error';
  rating?: -1 | 0 | 1;
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
}

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onCreateConversation: (data: { 
    title: string; 
    gaAccountId?: string; 
    gaPropertyId?: string; 
  }) => Promise<void>;
  isLoading?: boolean;
  gaAccounts: GaAccount[];
}

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
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState(mockTags);
  const queryClient = useQueryClient();

  // Fetch GA accounts
  const { data: gaAccounts = [] } = useQuery<GaAccount[]>({
    queryKey: ['ga-accounts'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const response = await fetch(`/api/users/${session.user.id}/ga-accounts`);
      if (!response.ok) {
        throw new Error('Failed to fetch GA accounts');
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

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
            gaAccountId: conv.gaAccount?.gaAccountId,
            gaPropertyId: conv.gaProperty?.gaPropertyId,
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

  // Fetch selected conversation details
  const selectedConversationDetails = conversations.find(conv => conv.id === selectedConversation);

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; gaAccountId?: string; gaPropertyId?: string }) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      console.log('Sending message to API:', { conversationId, message });
      
      // Get GA details from the selected conversation
      const conversation = conversations.find(conv => conv.id === conversationId);
      console.log('Conversation details:', conversation);
      const gaAccountId = conversation?.gaAccountId;
      const gaPropertyId = conversation?.gaPropertyId;
      
      // Create a temporary message object with processing status
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date().toLocaleString(),
        status: 'processing'
      };

      // Add the temporary message to the messages array
      queryClient.setQueryData(['conversation-messages', conversationId], (oldData: Message[] = []) => [...oldData, tempMessage]);

      // Send the message to the LLM service
      const response = await fetch('/api/llm/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: message,
          conversationID: conversationId,
          dateToday: new Date().toISOString(),
          accountGA4: gaAccountId || 'default',
          propertyGA4: gaPropertyId || 'default'
        }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to send message';
        console.error('API error:', errorMessage);
        throw new Error(errorMessage);
      }

      // If the response is immediate, update the messages
      if (data.status === 'COMPLETED' && data.response) {
        return [
          {
            id: data.queryId,
            content: message,
            role: 'user',
            timestamp: new Date().toLocaleString()
          },
          {
            id: `${data.queryId}-response`,
            content: data.response,
            role: 'assistant',
            timestamp: new Date().toLocaleString()
          }
        ];
      }

      // If the response is async (IN_PROGRESS), start polling for status
      if (data.status === 'IN_PROGRESS') {
        // Return the temporary message and start polling
        startStatusPolling(data.queryId, conversationId);
        return [tempMessage];
      }

      throw new Error('Unexpected response from server');
    },
    onError: (error: Error) => {
      console.error('Message mutation error:', error);
      alert(error.message); // Temporary solution until toast is implemented
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Function to poll for query status
  const startStatusPolling = async (queryId: string, conversationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/llm/chat/status?queryId=${queryId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        if (data.status === 'COMPLETED' && data.response) {
          // Update the messages with the completed response
          queryClient.setQueryData(['conversation-messages', conversationId], (oldData: Message[] = []) => {
            // Remove the temporary message and add the final messages
            const filteredMessages = oldData.filter(msg => msg.id !== `temp-${Date.now()}`);
            return [
              ...filteredMessages,
              {
                id: queryId,
                content: data.response,
                role: 'assistant',
                timestamp: new Date().toLocaleString()
              }
            ];
          });
          clearInterval(pollInterval);
        } else if (data.status === 'FAILED') {
          throw new Error(data.error || 'Query processing failed');
        }
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Clear polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  };

  // Add rating mutation
  const rateMessageMutation = useMutation({
    mutationFn: async ({ messageId, rating }: { messageId: string; rating: -1 | 1 }) => {
      const response = await fetch(`/api/queries/${messageId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error('Failed to rate message');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the messages query to refresh the UI
      queryClient.invalidateQueries({ 
        queryKey: ['conversation-messages', selectedConversation] 
      });
    },
    onError: (error: Error) => {
      console.error('Rating mutation error:', error);
      // You might want to add toast notification here
    },
  });

  const handleCreateConversation = async (data: { 
    title: string; 
    gaAccountId?: string; 
    gaPropertyId?: string; 
  }) => {
    await createConversationMutation.mutate(data);
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
    try {
      if (!selectedConversation) {
        console.log('Creating new conversation...');
        const newConversation = await createConversationMutation.mutateAsync({
          title: 'New Conversation'
        });
        console.log('New conversation created:', newConversation);
        await sendMessageMutation.mutateAsync({
          conversationId: newConversation.id,
          message,
        });
      } else {
        console.log('Sending message to existing conversation:', selectedConversation);
        await sendMessageMutation.mutateAsync({
          conversationId: selectedConversation,
          message,
        });
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      throw error;
    }
  };

  const handleRateMessage = (messageId: string, rating: -1 | 1) => {
    // Remove -response suffix if present before making the API call
    const queryId = messageId.replace('-response', '');
    rateMessageMutation.mutate({ messageId: queryId, rating });
  };

  if (isLoadingConversations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <div className="hidden md:flex md:w-80 md:flex-col md:border-r">
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
            gaAccounts={gaAccounts}
          />
        </div>
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
            gaAccounts={gaAccounts}
          />
        </SheetContent>
      </Sheet>
      <div className="flex flex-1 flex-col">
        <ChatWindow
          messages={messages}
          isLoading={isLoadingMessages}
          gaAccountId={selectedConversationDetails?.gaAccountId}
          gaPropertyId={selectedConversationDetails?.gaPropertyId}
          onRateMessage={handleRateMessage}
        />
        <div className="border-t p-4">
          <div className="flex flex-1 items-center space-x-2">
            <div className="flex-1">
              <ChatInput onSend={handleSendMessage} />
            </div>
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
        </div>
      </div>
    </div>
  );
} 