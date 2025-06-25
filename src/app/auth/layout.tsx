/**
 * @file src/app/auth/layout.tsx
 * Layout for authentication pages (sign-in, etc.)
 * Provides a clean layout for authentication flows without navigation
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