/**
 * @file src/components/chat/ConversationTitle.tsx
 * Enhanced conversation title header with badges, icons, and improved UX.
 */

'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, BookmarkPlus, BookmarkMinus, User, Building2, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GaProperty {
    id: string;
    gaPropertyId: string;
    gaPropertyName: string;
}

interface GaAccount {
    id: string;
    gaAccountId: string;
    gaAccountName: string;
}

interface Client {
    id: string;
    name: string | null;
    email: string | null;
}

interface ConversationTitleProps {
    title: string;
    timestamp: string;
    isStarred: boolean;
    onToggleStar: () => Promise<void>;
    client?: Client;
    gaAccount?: GaAccount;
    gaProperty?: GaProperty;
    className?: string;
}

export default function ConversationTitle({
    title,
    timestamp,
    isStarred,
    onToggleStar,
    client,
    gaAccount,
    gaProperty,
    className,
}: ConversationTitleProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleStarClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await onToggleStar();
    };

    return (
        <div className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 py-3 flex flex-col gap-y-2 rounded-sm">
            <div
                className={cn(
                    className
                )}
                aria-label="Conversation header"
            >
                {/* Top row: Title, timestamp, star */}
                <div className="flex flex-row items-center justify-between gap-x-4">
                    <h1 className="text-sm md:text-base font-bold tracking-tight truncate" title={title}>
                        {title}
                    </h1>
                    <div className="relative group">
                        <button
                            onClick={handleStarClick}
                            className="ml-1 p-1 rounded-full text-muted-foreground hover:text-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={isStarred ? 'Unstar conversation' : 'Star conversation'}
                            title={isStarred ? 'Unstar conversation' : 'Star conversation'}
                            tabIndex={0}
                            type="button"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            {isStarred ? (
                                isHovered ? (
                                    <BookmarkMinus className="h-5 w-5" />
                                ) : (
                                    <BookmarkCheck className="h-5 w-5" />
                                )
                            ) : (
                                isHovered ? (
                                    <BookmarkPlus className="h-5 w-5" />
                                ) : (
                                    <Bookmark className="h-5 w-5" />
                                )
                            )}
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:block rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                            {isStarred ? 'Unstar' : 'Star'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-row items-center gap-x-3">
                    <time
                        className="text-xs md:text-sm text-muted-foreground whitespace-nowrap"
                        dateTime={timestamp}
                        aria-label="Last updated"
                    >
                        {timestamp}
                    </time>

                </div>
            </div>
        </div>
    );
}