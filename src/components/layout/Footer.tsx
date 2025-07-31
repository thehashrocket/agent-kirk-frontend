/**
 * @file src/components/layout/Footer.tsx
 * Main footer component that provides branding and copyright information.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Kirk logo branding
 * - Copyright information
 * - Responsive design
 * - Consistent styling with header
 */

'use client'
import Link from "next/link";
import Image from "next/image";
import { usePathname } from 'next/navigation';

/**
 * @component Footer
 * Client Component that renders the main footer.
 * 
 * Features:
 * - Kirk logo branding
 * - Copyright information
 * - Responsive design
 * - Consistent styling with header
 * 
 * Layout:
 * - Full width with container constraints
 * - Centered content
 * - Proper spacing and typography
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Hide footer on chat route
  if (pathname === '/chat') return null;

  return (
    <footer className="fixed bottom-0 z-50 w-full border-t bg-gradient-to-r from-primary/5 via-primary/10 to-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-6 px-4">
        {/* Show items in a row and justify-between space between them. */}
        <div className="flex flex-row justify-between space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-2 font-medium text-gray-900 hover:text-primary/90 transition-colors"
          >
            <Image
              src="/images/Agent-Kirk-Primary-Horizontal-Logo_Color-CMYK.svg"
              alt="Agent Kirk"
              width={150}
              height={150}
              className="h-8 w-auto"
            />
          </Link>
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} Agent Kirk. All rights reserved.
          </p>
          <Link
            href="https://1905newmedia.com"
            className="flex items-center space-x-2 font-medium text-gray-900 hover:text-primary/90 transition-color"
          >
            <Image
              src="/images/1905-New-Media-Primary-Horizontal Logo_Color-RGB.svg"
              alt="1905 New Media"
              width={150}
              height={150}
              className="h-8 w-auto"
            />
          </Link>
                 </div>
      </div>
    </footer>
  );
}