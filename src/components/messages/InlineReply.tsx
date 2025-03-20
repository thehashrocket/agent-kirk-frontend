/**
 * @file src/components/messages/InlineReply.tsx
 * Inline reply component for responding to messages directly in the thread.
 */

'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InlineReplyProps {
  recipientId: string;
  parentMessageId: string;
  onReplyComplete: () => void;
  onCancel: () => void;
}

export function InlineReply({
  recipientId,
  parentMessageId,
  onReplyComplete,
  onCancel
}: InlineReplyProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: async (payload: {
      content: string;
      recipientId: string;
      parentId: string;
      attachments: Array<{
        filename: string;
        fileSize: number;
        mimeType: string;
        url: string;
      }>;
    }) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.[0]?.message || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the parent message query to show the new reply
      queryClient.invalidateQueries({ queryKey: ['message', parentMessageId] });
      // Invalidate the messages list query to show the new message in the list
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setContent('');
      setFiles([]);
      onReplyComplete();
    },
    onError: (err) => {
      console.error('Error sending reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reply. Please try again.');
    },
  });

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      sendReply({
        content,
        recipientId,
        parentId: parentMessageId,
        attachments,
      });
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Failed to process attachments. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pl-8">
      <div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your reply..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Add files
          </Button>
          <span className="text-sm text-muted-foreground">
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
                <span className="text-muted-foreground">
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-destructive hover:text-destructive/90"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={sending || !content.trim()}
        >
          {sending ? 'Sending...' : 'Send reply'}
        </Button>
      </div>
    </form>
  );
} 