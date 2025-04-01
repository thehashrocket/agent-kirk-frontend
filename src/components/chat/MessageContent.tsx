/**
 * @file src/components/chat/MessageContent.tsx
 * Component for rendering message content with markdown support.
 */

'use client';

import ReactMarkdown from 'react-markdown';
import { isMarkdown } from '@/lib/utils';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  if (isMarkdown(content)) {
    return (
      <div className="text-sm leading-normal">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
            p: ({ children }) => <p className="mb-2">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: ({ children }) => (
              <code className="bg-muted/50 rounded px-1 py-0.5">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted/50 rounded p-2 overflow-x-auto mb-2">{children}</pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-muted pl-2 italic mb-2">{children}</blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return <p className="text-sm whitespace-pre-wrap">{content}</p>;
} 