/**
 * @file src/components/chat/TagSelector.tsx
 * Tag selector component that manages conversation tags with add/remove functionality.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Add new tags
 * - Remove existing tags
 * - Inline tag creation
 * - Keyboard navigation
 * - Responsive design
 * 
 * Layout:
 * - Horizontal tag list
 * - Add tag button
 * - Inline tag input form
 * - Remove buttons on each tag
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Interface for tag data.
 * @property {string} id - Unique identifier for the tag
 * @property {string} name - Display name of the tag
 */
interface Tag {
  id: string;
  name: string;
}

/**
 * Props for the TagSelector component.
 * @property {Tag[]} selectedTags - Array of currently selected tags
 * @property {function} onAddTag - Callback when a new tag is added
 * @property {function} onRemoveTag - Callback when a tag is removed
 * @property {string} className - Optional CSS class names
 */
interface TagSelectorProps {
  selectedTags: Tag[];
  onAddTag: (tag: Tag) => void;
  onRemoveTag: (tagId: string) => void;
  className?: string;
}

/**
 * @component TagSelector
 * Client Component that renders a tag management interface.
 * 
 * Features:
 * - Dynamic tag creation
 * - Tag removal
 * - Keyboard shortcuts (Enter to add, Escape to cancel)
 * - Responsive layout
 * 
 * Layout:
 * - Horizontal scrolling tag list
 * - Inline tag creation form
 * - Each tag shows:
 *   - Tag name
 *   - Remove button
 * 
 * Accessibility:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Focus management
 * - Clear button states
 */
export function TagSelector({
  selectedTags,
  onAddTag,
  onRemoveTag,
  className,
}: TagSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleAddTag = () => {
    if (newTagName.trim()) {
      onAddTag({
        id: crypto.randomUUID(),
        name: newTagName.trim(),
      });
      setNewTagName('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTagName('');
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="region" aria-label="Tag selection">
      {selectedTags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1"
          role="listitem"
        >
          <span className="text-sm">{tag.name}</span>
          <button
            onClick={() => onRemoveTag(tag.id)}
            className="ml-1 rounded-full p-1 hover:bg-secondary-foreground/10"
            aria-label={`Remove ${tag.name} tag`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      ))}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter tag name..."
            className="h-8 w-32"
            autoFocus
            aria-label="New tag name"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewTagName('');
            }}
            aria-label="Cancel adding tag"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setIsAdding(true)}
          aria-label="Add new tag"
        >
          Add Tag
        </Button>
      )}
    </div>
  );
} 