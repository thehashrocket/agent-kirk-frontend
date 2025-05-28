'use client';

import { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message, MessageStatus, MESSAGE_STATUS } from '@/types/chat';

interface ChatMessage extends Message {
  status: MessageStatus;
}

export default function ClientChatPage() {
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

  return (
    <div className="flex h-screen flex-col bg-background">
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
  );
}
