'use client';

/**
 * @file Chat Interface Page Component
 * @description Main chat interface page that provides a conversation UI with async response handling,
 * conversation management, and Google Analytics integration
 * @module app/chat/page
 */

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
import { Button } from '@/components/ui/button';
import ConversationTitle from '@/components/chat/ConversationTitle';

/**
 * @interface Conversation
 * @description Represents a chat conversation with its metadata
 */
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isStarred: boolean;
  gaAccountId?: string;
  gaPropertyId?: string;
  clientId?: string; // New: client ID for account reps
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
  client?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

/**
 * @interface GaAccount
 * @description Google Analytics account information
 */
interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
  userId?: string; // The user who owns this account
}

/**
 * @interface GaProperty
 * @description Google Analytics property information
 */
interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

/**
 * @interface Client
 * @description Client user information for account representatives
 */
interface Client {
  id: string;
  name: string | null;
  email: string | null;
  gaAccounts: GaAccount[];
}

// Mock data for development
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

/**
 * @function ChatPage
 * @description Main chat interface page component with conversation management and real-time message handling
 * @returns {JSX.Element} Chat interface with conversation list and chat window
 */
export default function ChatPage() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [selectedTags, setSelectedTags] = useState(mockTags);
  const queryClient = useQueryClient();
  
  const isAccountRep = session?.user?.role === 'ACCOUNT_REP';

  /**
   * Fetch Google Analytics accounts for the current user
   */
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
    enabled: !!session?.user?.id && !isAccountRep, // Only enable for non-account reps
  });
  
  /**
   * Fetch clients for account representatives
   */
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const users = await response.json();
      
      // Transform the data to match the expected Client interface
      return users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        gaAccounts: user.userToGaAccounts?.map((association: any) => ({
          id: association.gaAccount.id,
          gaAccountId: association.gaAccount.gaAccountId,
          gaAccountName: association.gaAccount.gaAccountName,
          gaProperties: association.gaAccount.gaProperties || []
        })) || []
      }));
    },
    enabled: !!session?.user?.id && isAccountRep, // Only enable for account reps
  });

  /**
   * Fetch all conversations for the current user
   */
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
            clientId: conv.client?.id,
            client: conv.client ? {
              id: conv.client.id,
              name: conv.client.name,
              email: conv.client.email
            } : undefined,
            gaAccount: conv.gaAccount ? {
              id: conv.gaAccount.id,
              gaAccountId: conv.gaAccount.gaAccountId,
              gaAccountName: conv.gaAccount.gaAccountName
            } : undefined,
            gaProperty: conv.gaProperty ? {
              id: conv.gaProperty.id,
              gaPropertyId: conv.gaProperty.gaPropertyId,
              gaPropertyName: conv.gaProperty.gaPropertyName
            } : undefined
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

  /**
   * Effect to update selected conversation when conversations load
   */
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  /**
   * Fetch messages for currently selected conversation
   */
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

  /**
   * Mutation to create a new conversation
   */
  const createConversationMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      gaAccountId?: string; 
      gaPropertyId?: string;
      clientId?: string; // New: client ID for account reps
    }) => {
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

  /**
   * Mutation to star or unstar a conversation
   */
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

  /**
   * Mutation to send a message and handle both synchronous and asynchronous responses
   */
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

  /**
   * Polls the server for message status updates when handling async responses
   * @param queryId - ID of the query to poll for
   * @param conversationId - ID of the conversation being updated
   */
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

  /**
   * Mutation to add thumbs up/down rating to a message
   */
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

  /**
   * Creates a new conversation
   * @param data - Data for the new conversation (title, GA account ID, GA property ID, client ID)
   */
  const handleCreateConversation = async (data: { 
    title: string; 
    gaAccountId?: string; 
    gaPropertyId?: string;
    clientId?: string; // New: client ID for account reps
  }) => {
    try {
      await createConversationMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // You might want to add toast notification here
    }
  };

  /**
   * Toggles starred status for a conversation
   * @param id - ID of the conversation to toggle
   */
  const handleToggleStar = async (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      starMutation.mutate({
        id,
        isStarred: !conversation.isStarred,
      });
    }
  };

  /**
   * Selects a conversation and closes the mobile menu
   * @param id - ID of the conversation to select
   */
  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setIsMobileMenuOpen(false);
  };

  /**
   * Handles sending a message to the selected conversation
   * @param message - The message content to send
   */
  const handleSendMessage = async (message: string) => {
    if (!selectedConversation) return;
    
    await sendMessageMutation.mutateAsync({
      conversationId: selectedConversation,
      message,
    });
  };

  /**
   * Adds a thumbs up/down rating to a message
   * @param messageId - ID of the message to rate
   * @param rating - Rating value (1 for thumbs up, -1 for thumbs down)
   */
  const handleRateMessage = (messageId: string, rating: -1 | 1) => {
    // Remove -response suffix if present before making the API call
    const queryId = messageId.replace('-response', '');
    rateMessageMutation.mutate({ messageId: queryId, rating });
  };

  if (isLoadingConversations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation}
            onSelect={handleSelectConversation}
            onToggleStar={handleToggleStar}
            onCreateConversation={handleCreateConversation}
            isLoading={createConversationMutation.isPending}
            gaAccounts={gaAccounts}
            clients={isAccountRep ? clients : []} // Pass clients data to ConversationList
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Collapsible */}
      <div className={`hidden md:flex md:flex-col h-full border-r transition-all duration-300 ${
        isDesktopSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-110'
      }`}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
          onToggleStar={handleToggleStar}
          onCreateConversation={handleCreateConversation}
          isLoading={createConversationMutation.isPending}
          gaAccounts={gaAccounts}
          clients={isAccountRep ? clients : []} // Pass clients data to ConversationList
        />
      </div>

      <div className="flex flex-1 flex-col h-full">
        {/* Mobile Header */}
        <div className="flex justify-between items-center border-b p-4 md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="sr-only">Open menu</span>
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
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          <h1 className="text-lg font-medium">Chat</h1>
          <div className="w-10" />
        </div>

        {/* Desktop Header with Sidebar Toggle */}
        <div className="hidden md:flex justify-between items-center border-b p-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="transition-transform duration-200 hover:scale-105"
          >
            <span className="sr-only">
              {isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
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
              className={`h-4 w-4 transition-transform duration-200 ${
                isDesktopSidebarCollapsed ? 'rotate-180' : ''
              }`}
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Button>
          <h1 className="text-lg font-medium">
            {selectedConversationDetails?.title || 'Chat'}
          </h1>
          <div className="w-10" />
        </div>

        {selectedConversation ? (
          <div className="flex flex-col flex-1">
            <ConversationTitle
              title={selectedConversationDetails?.title || ''}
              timestamp={selectedConversationDetails?.timestamp || ''}
              isStarred={selectedConversationDetails?.isStarred || false}
              onToggleStar={() => handleToggleStar(selectedConversation)}
              client={selectedConversationDetails?.client}
              gaAccount={selectedConversationDetails?.gaAccount}
              gaProperty={selectedConversationDetails?.gaProperty}
            />
            <div className="flex space-x-2 p-4 border-b">
              <TagSelector 
                selectedTags={selectedTags}
                onAddTag={(tag) => setSelectedTags([...selectedTags, tag])}
                onRemoveTag={(tagId) => setSelectedTags(selectedTags.filter(tag => tag.id !== tagId))}
              />
              <SourcesButton sources={mockSources} />
            </div>

            <div className="flex-1 overflow-y-auto">
              <ChatWindow
                messages={messages}
                isLoading={sendMessageMutation.isPending}
                gaAccountId={selectedConversationDetails?.gaAccountId}
                gaPropertyId={selectedConversationDetails?.gaPropertyId}
                onRateMessage={handleRateMessage}
              />
            </div>

            <div className="border-t p-4">
              <ChatInput onSend={handleSendMessage} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">No Conversation Selected</h2>
            <p className="text-muted-foreground mb-4">
              Select an existing conversation or create a new one to get started.
            </p>
            <Button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
            >
              Show Conversations
            </Button>
            {/* Desktop: Show expand sidebar button when collapsed and no conversation */}
            <Button
              onClick={() => setIsDesktopSidebarCollapsed(false)}
              className="hidden md:inline-flex"
              variant="outline"
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
                className="h-4 w-4 mr-2"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
              Show Conversations
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 