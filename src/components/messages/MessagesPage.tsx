/**
 * @file src/components/messages/MessagesPage.tsx
 * Messages page component that provides a complete messaging interface.
 * Handles message display, pagination, and message status management.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageList } from './MessageList';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Session } from 'next-auth';

/**
 * Interface representing a message in the system.
 * Includes message content, metadata, sender/recipient info, attachments,
 * and thread-related data.
 */
interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  parentId: string | null;
  threadId: string | null;
  isThreadStart: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    url: string;
  }>;
  sender: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  recipient: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  parent?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
  };
  replies?: Array<{
    id: string;
    content: string;
    sender: {
      id: string;
      name: string | null;
    };
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
  const searchParams = useSearchParams();
  const [view, setView] = useState<'inbox' | 'outbox'>(initialView);
  const [error, setError] = useState('');

  const threadId = searchParams.get('threadId');

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-6">
        <Button
          onClick={() => setView('inbox')}
          variant={view === 'inbox' ? 'default' : 'outline'}
        >
          Inbox
        </Button>
        <Button
          onClick={() => setView('outbox')}
          variant={view === 'outbox' ? 'default' : 'outline'}
        >
          Sent
        </Button>
      </div>

      {error && (
        <Card className="p-4 text-destructive bg-destructive/10">
          {error}
        </Card>
      )}

      <MessageList
        recipientId={view === 'inbox' ? (session as Session).user.id : undefined}
        threadId={threadId || undefined}
        currentUserId={(session as Session).user.id}
        view={view}
      />
    </div>
  );
}