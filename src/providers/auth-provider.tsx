'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_DASHBOARDS = {
  ADMIN: '/admin/dashboard',
  ACCOUNT_REP: '/account-rep/dashboard',
  CLIENT: '/client/dashboard'
} as const;

const PUBLIC_PATHS = ['/auth', '/about', '/onboarding', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // Allow access to public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
      return;
    }

    // If user is not authenticated, redirect to sign in
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // If user is authenticated, handle role-based routing
    if (session?.user) {
      const role = session.user.role;
      const user = session.user;

      // Check if client needs to complete onboarding
      if (role === 'CLIENT' && !user.companyId) {
        // Client without company should go to onboarding
        if (!pathname.startsWith('/onboarding')) {
          router.push('/onboarding/step1');
          return;
        }
        // If already on onboarding path, allow access
        return;
      }

      const roleDashboard = ROLE_DASHBOARDS[role as keyof typeof ROLE_DASHBOARDS];

      // If no valid role dashboard, redirect to home
      if (!roleDashboard) {
        router.push('/');
        return;
      }

      // Redirect from root to role-specific dashboard
      if (pathname === '/') {
        router.push(roleDashboard);
        return;
      }

      // Check if user is trying to access a role-specific area
      const isInValidPath = Object.entries(ROLE_DASHBOARDS).every(([currentRole, path]) => {
        const isCurrentRolePath = pathname.startsWith(path.split('/')[1]);
        return role === currentRole || !isCurrentRolePath;
      });

      // If user is in wrong role area, redirect to their dashboard
      if (!isInValidPath) {
        router.push(roleDashboard);
      }
    }
  }, [session, status, pathname, router]);

  const value = {
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    role: session?.user?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}