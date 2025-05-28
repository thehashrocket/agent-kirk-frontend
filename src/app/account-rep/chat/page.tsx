'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message, MessageStatus, MESSAGE_STATUS } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessage extends Message {
  status: MessageStatus;
}

export default function AccountRepChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleSendMessage = async (message: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: message,
      role: 'user',
      timestamp: new Date().toLocaleString(),
      status: MESSAGE_STATUS.COMPLETED
    };

    // Add assistant message with processing status
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: 'Thinking...',
      role: 'assistant',
      timestamp: new Date().toLocaleString(),
      status: MESSAGE_STATUS.PROCESSING
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(process.env.LLM_GENERAL_CHAT_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: message,
          sessionID: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Update the assistant message with the response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: data.output,
              status: MESSAGE_STATUS.COMPLETED
            }
          : msg
      ));
    } catch (error) {
      // Update the assistant message with error status
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: 'Sorry, there was an error processing your request.',
              status: MESSAGE_STATUS.ERROR
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Please sign in to access the chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Internal Chat
        </h1>
        <p className="text-gray-600">Chat with Agent Kirk for internal support and questions</p>
      </div>

      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle>Chat Session</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)]">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
              />
            </div>
            <div className="border-t p-4">
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 