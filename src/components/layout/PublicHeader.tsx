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

import Link from "next/link";
import Image from "next/image";

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
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-6">
          <Link
            href="/"
            className="flex items-center space-x-2 font-medium text-primary hover:text-primary/90 transition-colors"
          >
            <Image 
              src="/images/Agent-Kirk-Primary-Horizontal-Logo_Color-CMYK.svg" 
              alt="Agent Kirk" 
              width={125} 
              height={125} 
            />
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {/* Right side can be expanded later if needed */}
        </div>
      </div>
    </header>
  );
} 