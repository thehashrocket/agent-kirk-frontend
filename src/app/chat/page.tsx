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
import { 
  Message, 
  QueryRequest, 
  apiStatusToMessageStatus, 
  MESSAGE_STATUS,
  API_STATUS
} from '@/types/chat';

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
      console.log('[Debug] Starting message mutation for conversation:', conversationId);
      
      // Get GA details from the selected conversation
      const conversation = conversations.find(conv => conv.id === conversationId);
      const gaAccountId = conversation?.gaAccountId;
      const gaPropertyId = conversation?.gaPropertyId;
      
      // Create a temporary message object with processing status
      const tempMessage: Message = {
        id: crypto.randomUUID(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        status: MESSAGE_STATUS.COMPLETED
      };

      // Create a temporary assistant message
      const tempAssistantMessage: Message = {
        id: crypto.randomUUID(),
        content: 'Thinking...',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        status: MESSAGE_STATUS.PROCESSING
      };

      console.log('[Debug] Created temporary messages:', {
        userMessage: tempMessage.id,
        assistantMessage: tempAssistantMessage.id
      });

      // Optimistically update the UI
      queryClient.setQueryData(['conversation-messages', conversationId], (old: Message[] = []) => {
        console.log('[Debug] Current messages before update:', old?.length);
        return [...old, tempMessage, tempAssistantMessage];
      });

      // Send the actual request
      const response = await fetch('/api/llm/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          conversationId,
          ...(gaAccountId && { gaAccountId }),
          ...(gaPropertyId && { gaPropertyId }),
        } as QueryRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('[Debug] Received response from server:', {
        status: data.status,
        queryId: data.queryId,
        isAsync: data.status === 'IN_PROGRESS' || data.status === 'PENDING'
      });

      // Handle async response case
      if (data.status === 'IN_PROGRESS' || data.status === 'PENDING') {
        console.log('[Debug] Handling async response for queryId:', data.queryId);
        
        // Update the messages with the temporary messages but keep them in processing state
        queryClient.setQueryData(['conversation-messages', conversationId], (old: Message[] = []) => {
          console.log('[Debug] Updating messages for async case. Current count:', old?.length);
          
          // Remove the temporary messages
          const filteredMessages = old.filter(msg => 
            msg.id !== tempMessage.id && msg.id !== tempAssistantMessage.id
          );
          
          console.log('[Debug] Messages after filtering temps:', filteredMessages.length);
          
          // Add the user message and a processing message
          return [...filteredMessages, {
            id: data.queryId,
            content: message,
            role: 'user',
            timestamp: new Date().toISOString(),
            status: MESSAGE_STATUS.COMPLETED
          }, {
            id: `${data.queryId}-response`,
            content: 'This request is taking longer than expected. You will receive a notification when it\'s complete.',
            role: 'assistant',
            timestamp: new Date().toISOString(),
            status: MESSAGE_STATUS.PROCESSING
          }];
        });

        // Start polling for updates
        console.log('[Debug] Starting status polling for queryId:', data.queryId);
        startStatusPolling(data.queryId, conversationId);
        return data;
      }

      console.log('[Debug] Handling synchronous response');
      
      // Handle synchronous response case
      queryClient.setQueryData(['conversation-messages', conversationId], (old: Message[] = []) => {
        console.log('[Debug] Updating messages for sync case. Current count:', old?.length);
        
        // Remove the temporary messages
        const filteredMessages = old.filter(msg => 
          msg.id !== tempMessage.id && msg.id !== tempAssistantMessage.id
        );
        
        console.log('[Debug] Messages after filtering temps:', filteredMessages.length);
        
        // Add the actual messages
        return [...filteredMessages, {
          id: data.userQuery.id,
          content: data.userQuery.content,
          role: 'user',
          timestamp: data.userQuery.createdAt,
          status: MESSAGE_STATUS.COMPLETED
        }, {
          id: data.assistantResponse.id,
          content: data.assistantResponse.content || 'An error occurred',
          role: 'assistant',
          timestamp: data.assistantResponse.createdAt,
          status: apiStatusToMessageStatus(data.assistantResponse.status)
        }];
      });

      return data;
    },
    onError: (error: Error) => {
      console.error('[Debug] Message mutation error:', error);
      alert(error.message); // Temporary solution until toast is implemented
    },
    onSuccess: (data) => {
      console.log('[Debug] Message mutation success:', {
        status: data.status,
        queryId: data.queryId
      });
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Function to poll for query status
  const startStatusPolling = async (queryId: string, conversationId: string) => {
    console.log('[Debug] Starting polling for queryId:', queryId);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('[Debug] Polling status for queryId:', queryId);
        const response = await fetch(`/api/llm/chat/status?queryId=${queryId}`);
        const data = await response.json();

        console.log('[Debug] Poll response:', {
          queryId,
          status: data.status,
          hasResponse: !!data.response
        });

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        if (data.status === API_STATUS.COMPLETED && data.response) {
          console.log('[Debug] Query completed, updating message');
          
          // Update the messages by replacing the processing message with the completed one
          queryClient.setQueryData(['conversation-messages', conversationId], (oldData: Message[] = []) => {
            console.log('[Debug] Current messages before completion update:', oldData?.length);
            
            const updatedMessages = oldData.map(msg => {
              // Replace the processing message with the completed response
              if (msg.id === `${queryId}-response`) {
                console.log('[Debug] Found and updating processing message');
                return {
                  id: `${queryId}-response`,
                  content: data.response,
                  role: 'assistant',
                  timestamp: new Date().toLocaleString(),
                  status: MESSAGE_STATUS.COMPLETED
                };
              }
              return msg;
            });
            
            console.log('[Debug] Messages after completion update:', updatedMessages.length);
            return updatedMessages;
          });
          
          // Invalidate queries to ensure UI is up to date
          queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          console.log('[Debug] Clearing poll interval');
          clearInterval(pollInterval);
        } else if (data.status === API_STATUS.FAILED) {
          console.log('[Debug] Query failed, updating error message');
          
          // Update the processing message to show the error
          queryClient.setQueryData(['conversation-messages', conversationId], (oldData: Message[] = []) => {
            return oldData.map(msg => {
              if (msg.id === `${queryId}-response`) {
                return {
                  ...msg,
                  content: data.error || 'An error occurred while processing your request.',
                  status: MESSAGE_STATUS.ERROR
                };
              }
              return msg;
            });
          });
          throw new Error(data.error || 'Query processing failed');
        }
      } catch (error) {
        console.error('[Debug] Status polling error:', error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Clear polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      console.log('[Debug] Clearing poll interval due to timeout');
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
        const newConversation = await createConversationMutation.mutateAsync({
          title: 'New Conversation'
        });
        await sendMessageMutation.mutateAsync({
          conversationId: newConversation.id,
          message,
        });
      } else {
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