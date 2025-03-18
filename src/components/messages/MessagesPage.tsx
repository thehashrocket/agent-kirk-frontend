/**
 * @file src/components/messages/MessagesPage.tsx
 * Messages page component that provides a complete messaging interface.
 * Handles message display, pagination, and message status management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Interface representing a message in the system.
 * Includes message content, metadata, sender information, and attachments.
 */
interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  attachments: Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }>;
}

/**
 * Props for the MessagesPage component.
 * @property {('inbox'|'outbox')} [initialView='inbox'] - Initial view mode for the messages list
 */
interface MessagesPageProps {
  initialView?: 'inbox' | 'outbox';
}

/**
 * @component MessagesPage
 * @path src/components/messages/MessagesPage.tsx
 * Main component for displaying and managing messages.
 * Features:
 * - Toggle between inbox and outbox views
 * - Infinite scroll pagination
 * - Mark messages as read
 * - Display message attachments
 * - Error handling and loading states
 * 
 * @param {MessagesPageProps} props - Component props
 */
export default function MessagesPage({ initialView = 'inbox' }: MessagesPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [view, setView] = useState<'inbox' | 'outbox'>(initialView);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetches messages from the API based on current page and view.
   * Handles pagination by appending new messages to existing ones.
   * Updates hasMore flag based on pagination information.
   */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?page=${page}&view=${view}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      
      if (page === 1) {
        setMessages(data.messages);
      } else {
        setMessages(prev => [...prev, ...data.messages]);
      }
      
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, view]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Marks a message as read and updates the UI accordingly.
   * @param {string} messageId - ID of the message to mark as read
   */
  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  /**
   * Loads the next page of messages when user reaches the end of the list.
   * Only triggers if there are more messages to load and not currently loading.
   */
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => { setView('inbox'); setPage(1); }}
          className={`px-4 py-2 rounded-md ${
            view === 'inbox'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => { setView('outbox'); setPage(1); }}
          className={`px-4 py-2 rounded-md ${
            view === 'outbox'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Sent
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`p-4 rounded-lg shadow ${
              !message.isRead && view === 'inbox'
                ? 'bg-blue-50'
                : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500">
                  {view === 'inbox' ? 'From: ' : 'To: '}
                  {view === 'inbox'
                    ? message.sender.name || 'Unknown'
                    : message.recipientId}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
              {view === 'inbox' && !message.isRead && (
                <button
                  onClick={() => markAsRead(message.id)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Mark as read
                </button>
              )}
            </div>
            
            <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
            
            {message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">Attachments:</p>
                {message.attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {attachment.filename}
                    </a>
                    <span className="text-gray-500">
                      ({Math.round(attachment.fileSize / 1024)}KB)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
} 