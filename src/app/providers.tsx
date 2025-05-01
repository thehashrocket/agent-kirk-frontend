'use client';

import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/providers/auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
} 