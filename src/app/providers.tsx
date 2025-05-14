'use client';

import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/providers/auth-provider';
import QueryProvider from '@/providers/query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </AuthProvider>
      </SessionProvider>
    </QueryProvider>
  );
} 