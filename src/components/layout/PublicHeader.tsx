/**
 * @file src/components/layout/PublicHeader.tsx
 * Public header component for non-authenticated pages like sign-in.
 * Provides basic navigation and branding without requiring user session.
 * 
 * Features:
 * - Company logo/branding
 * - Consistent styling with main header
 * - No authentication requirements
 */

'use client'

import Link from "next/link";
import Image from "next/image";
import { UserProfileBadge } from "./UserProfileBadge";
import { MobileNav } from "./MobileNav";
import { useSession } from "next-auth/react";

/**
 * @component PublicHeader
 * Header component for public pages (sign-in, etc.)
 * 
 * Features:
 * - Displays company logo
 * - Consistent styling with authenticated header
 * - Responsive design
 * - No session requirements
 */
export function PublicHeader() {
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 flex items-center justify-between mx-auto">
        <MobileNav />
        <nav className="flex items-center space-x-6 ml-4">
          <Link
            href="/"
            className="flex items-center space-x-2 font-medium text-primary hover:text-primary/90 transition-colors"
          >
            <Image src="/images/Agent-Kirk-Primary-Horizontal-Logo_Color-CMYK.svg" alt="Agent Kirk" width={125} height={125} />
          </Link>
          
          {/* Show GA Data chat only for clients and account reps */}
          
          
        </nav>
        <div className="flex items-center space-x-4">
          <UserProfileBadge />
          
        </div>
      </div>
    </header>
  );
} 