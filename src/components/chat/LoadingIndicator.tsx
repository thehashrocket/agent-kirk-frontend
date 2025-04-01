/**
 * @file src/components/chat/LoadingIndicator.tsx
 * Loading indicator component with customizable size and message.
 */

'use client';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md';
  message?: string;
}

export function LoadingIndicator({ size = 'md', message }: LoadingIndicatorProps) {
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  
  return (
    <div 
      className="flex w-full max-w-2xl items-center space-x-4 rounded-lg bg-muted p-4"
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="space-y-2">
        {message && (
          <span className="text-xs opacity-70">{message}</span>
        )}
        <div className="flex space-x-2">
          <div className={`${dotSize} animate-bounce rounded-full bg-current`} />
          <div className={`${dotSize} animate-bounce rounded-full bg-current [animation-delay:0.2s]`} />
          <div className={`${dotSize} animate-bounce rounded-full bg-current [animation-delay:0.4s]`} />
        </div>
      </div>
    </div>
  );
} 