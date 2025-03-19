/**
 * @file src/components/chat/SourcesButton.tsx
 * Sources button component that displays LLM source information in a modal dialog.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Modal dialog for source display
 * - Source relevance scoring
 * - External link handling
 * - Responsive design
 * 
 * Layout:
 * - Button trigger
 * - Modal dialog with scrollable content
 * - Source cards with title, URL, and relevance
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Interface for source data.
 * @property {string} id - Unique identifier for the source
 * @property {string} title - Display title of the source
 * @property {string} url - URL to the source
 * @property {number} relevance - Relevance score (0-1)
 */
interface Source {
  id: string;
  title: string;
  url: string;
  relevance: number;
}

/**
 * Props for the SourcesButton component.
 * @property {Source[]} sources - Array of sources to display
 * @property {string} className - Optional CSS class names
 */
interface SourcesButtonProps {
  sources: Source[];
  className?: string;
}

/**
 * @component SourcesButton
 * Client Component that renders a button to display LLM sources in a modal dialog.
 * 
 * Features:
 * - Modal dialog interface
 * - Scrollable source list
 * - Source relevance display
 * - External link handling
 * 
 * Layout:
 * - Trigger button
 * - Full-screen modal on mobile
 * - Centered modal on desktop
 * - Source cards with:
 *   - Title
 *   - URL link
 *   - Relevance score
 * 
 * Accessibility:
 * - Proper dialog role
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 */
export function SourcesButton({ sources, className }: SourcesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label="View sources"
      >
        Sources
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sources Used</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh]">
            <div className="space-y-4 p-4" role="list" aria-label="Source list">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border bg-card p-4 text-card-foreground"
                  role="listitem"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{source.title}</h3>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                        aria-label={`Visit source: ${source.title}`}
                      >
                        {source.url}
                      </a>
                    </div>
                    <div 
                      className="ml-4 text-sm text-muted-foreground"
                      aria-label={`Relevance score: ${Math.round(source.relevance * 100)}%`}
                    >
                      {Math.round(source.relevance * 100)}% relevant
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
} 