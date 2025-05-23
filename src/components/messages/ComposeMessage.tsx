/**
 * @file src/components/messages/ComposeMessage.tsx
 * Message composition component that provides a form for creating and sending messages.
 * Supports text content and file attachments with validation and error handling.
 */

'use client';

import { useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';

/**
 * Props for the ComposeMessage component.
 * @property {Function} [onMessageSent] - Callback function triggered after successful message send
 * @property {string} [recipientId] - ID of the message recipient (optional)
 */
interface ComposeMessageProps {
  onMessageSent?: () => void;
  recipientId?: string;
}

/**
 * Interface for recipient data
 */
interface Recipient {
  id: string;
  name: string;
}

/**
 * @component ComposeMessage
 * @path src/components/messages/ComposeMessage.tsx
 * Form component for composing and sending messages.
 * Features:
 * - Text message composition
 * - File attachments with size validation
 * - Loading and error states
 * - Success callback
 * 
 * @param {ComposeMessageProps} props - Component props
 */
export default function ComposeMessage({ onMessageSent, recipientId: initialRecipientId }: ComposeMessageProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState(initialRecipientId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available recipients if no recipientId is provided
  const { data: recipients = [], isLoading: isLoadingRecipients } = useQuery<Recipient[]>({
    queryKey: ['recipients'],
    queryFn: async () => {
      if (initialRecipientId) return []; // Don't fetch if we have a recipient
      const response = await fetch('/api/recipients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipients');
      }
      return response.json();
    },
    enabled: !initialRecipientId // Only fetch if no recipientId provided
  });

  /**
   * Handles file selection and validation.
   * Validates file size (max 10MB) and adds valid files to the state.
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Removes a file from the attachments list.
   * @param {number} index - Index of the file to remove
   */
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handles message submission.
   * Converts files to base64, sends message with attachments to the API,
   * and handles success/error states.
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      // Convert files to attachments
      const attachments = await Promise.all(
        files.map(async file => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            url: base64,
          };
        })
      );

      const recipientId = initialRecipientId || selectedRecipientId;
      if (!recipientId) {
        throw new Error('Please select a recipient');
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          recipientId,
          attachments,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      setContent('');
      setFiles([]);
      onMessageSent?.();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initialRecipientId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To:
          </label>
          <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId} disabled={isLoadingRecipients}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingRecipients ? "Loading recipients..." : "Select recipient"} />
            </SelectTrigger>
            <SelectContent>
              {recipients?.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  {recipient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Type your message here..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Attachments
        </label>
        <div className="mt-1 flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add files
          </button>
          <span className="text-sm text-gray-500">
            Max file size: 10MB
          </span>
        </div>

        {files.length > 0 && (
          <ul className="mt-2 space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending || !content.trim() || (!initialRecipientId && !selectedRecipientId)}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </form>
  );
} 