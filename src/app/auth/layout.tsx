/**
 * @file src/app/auth/layout.tsx
 * Layout for authentication pages (sign-in, etc.)
 * Includes public header for consistency with the main site
 */

import { PublicHeader } from "@/components/layout/PublicHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 