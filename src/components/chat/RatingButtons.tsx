/**
 * @file src/components/chat/RatingButtons.tsx
 * Rating buttons component with animations and visual feedback.
 */

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RatingButtonsProps {
  messageId: string;
  initialRating?: -1 | 0 | 1;
  onRate: (messageId: string, rating: -1 | 1) => void;
}

export function RatingButtons({ messageId, initialRating = 0, onRate }: RatingButtonsProps) {
  const [rating, setRating] = useState<-1 | 0 | 1>(initialRating);
  const [isAnimating, setIsAnimating] = useState<'up' | 'down' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRate = async (newRating: -1 | 1) => {
    // If clicking the same rating, unrate
    const ratingToApply = rating === newRating ? 0 : newRating;
    
    setIsLoading(true);
    setIsAnimating(ratingToApply === 1 ? 'up' : ratingToApply === -1 ? 'down' : null);

    try {
      // Only call onRate if we're not unrating
      if (ratingToApply !== 0) {
        await onRate(messageId, ratingToApply);
      }
      setRating(ratingToApply);
    } catch (error) {
      console.error('Error applying rating:', error);
    } finally {
      setIsLoading(false);
      // Clear animation after a delay
      setTimeout(() => setIsAnimating(null), 500);
    }
  };

  return (
    <div className="flex items-center space-x-2" role="group" aria-label="Rate response">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "transition-all duration-200",
          "hover:text-primary hover:scale-110",
          rating === 1 && "text-primary fill-primary",
          isAnimating === 'up' && "animate-wiggle",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isLoading && handleRate(1)}
        disabled={isLoading}
        aria-label="Thumbs up"
        aria-pressed={rating === 1}
      >
        <ThumbsUp className={cn(
          "h-4 w-4",
          rating === 1 && "fill-current"
        )} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "transition-all duration-200",
          "hover:text-destructive hover:scale-110",
          rating === -1 && "text-destructive fill-destructive",
          isAnimating === 'down' && "animate-wiggle",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isLoading && handleRate(-1)}
        disabled={isLoading}
        aria-label="Thumbs down"
        aria-pressed={rating === -1}
      >
        <ThumbsDown className={cn(
          "h-4 w-4",
          rating === -1 && "fill-current"
        )} />
      </Button>
    </div>
  );
} 