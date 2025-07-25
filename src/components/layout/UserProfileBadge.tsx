// src/components/layout/UserProfileBadge.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { normalizeNames } from "@/lib/utils/normalize-names";

/**
 * UserProfileBadge Component
 * 
 * Displays the user's avatar and profile information in the application header.
 * Shows user's image if available, falls back to initials.
 * Responsive design - hides text content on mobile.
 */
export function UserProfileBadge() {
    const { data: session } = useSession() as { data: Session | null };
    
    if (!session?.user) return null;

    // Get initials from name or email, with proper null checks
    const initials = session.user.name?.trim()
        ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : session.user.email?.[0].toUpperCase() ?? '?';

    return (
        <div className="flex items-center gap-3" role="status" aria-label="User profile">
            <Avatar>
                <AvatarImage 
                    src={session.user.image ?? ''} 
                    alt={`Profile picture of ${session.user.name || 'user'}`} 
                />
                <AvatarFallback delayMs={600}>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium">{session.user.email}</span>
                <span className="text-xs text-muted-foreground">
                    {normalizeNames(session.user.role) || 'No Role'}
                </span>
            </div>
        </div>
    );
}
