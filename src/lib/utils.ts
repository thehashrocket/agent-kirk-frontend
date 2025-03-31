/**
 * @file src/lib/utils.ts
 * Utility functions for class name management and Tailwind CSS optimization.
 * Combines clsx for conditional class names and tailwind-merge for deduplication.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and optimizes them with tailwind-merge.
 * This utility helps manage conditional classes and prevents Tailwind CSS conflicts.
 * 
 * Features:
 * - Merges multiple class names
 * - Handles conditional classes
 * - Resolves Tailwind CSS conflicts
 * - Optimizes final class string
 * 
 * @param {...ClassValue[]} inputs - Class names or conditional class objects
 * @returns {string} Optimized class name string
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', { 'bg-blue-500': isActive }, 'text-white')
 * // Returns optimized class string with conflicts resolved
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if a string contains markdown formatting.
 * Looks for common markdown patterns like headings, lists, code blocks, etc.
 * 
 * @param {string} text - The text to check for markdown content
 * @returns {boolean} True if the text contains markdown patterns
 * 
 * @example
 * ```ts
 * isMarkdown('# Heading') // true
 * isMarkdown('Regular text') // false
 * ```
 */
export function isMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/, // Headers
    /(?:^|\n)(?:[*+-]|\d+\.)\s/, // Lists
    /`{1,3}[^`]*`{1,3}/, // Code (inline or blocks)
    /\[.*?\]\(.*?\)/, // Links
    /(?:\*\*|__)(?:(?!\*\*|__).)+(?:\*\*|__)/, // Bold
    /(?:\*|_)(?:(?!\*|_).)+(?:\*|_)/, // Italic
    /(?:^|\n)>\s/, // Blockquotes
    /(?:^|\n)(?:[-*_]){3,}(?:\n|$)/, // Horizontal rules
    /```[\s\S]*?```/, // Code blocks
    /\|[^\n]+\|/, // Tables
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
