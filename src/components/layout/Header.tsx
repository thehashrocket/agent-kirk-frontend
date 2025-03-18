/**
 * @file src/components/layout/Header.tsx
 * Main header component that provides navigation and user session management.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Role-based navigation links
 * - Session management with NextAuth
 * - Mobile-responsive design
 * - User session display
 * - Logout functionality
 */

'use client'
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { Home, MessageSquare, LogOut, LayoutDashboard } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * @component Header
 * Client Component that renders the main navigation header.
 * 
 * Features:
 * - Responsive navigation with mobile menu
 * - Role-based dashboard links
 * - Session status display
 * - Logout functionality
 * - Sticky positioning with backdrop blur
 * 
 * Layout:
 * - Fixed position at top of viewport
 * - Full width with container constraints
 * - Flexible spacing for navigation items
 * - Right-aligned user session info
 * 
 * Authentication:
 * - Requires active session
 * - Displays user email and role
 * - Provides logout button
 * - Returns null if no session
 */
export function Header() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  /**
   * Determines the appropriate dashboard link based on user role.
   * @returns {string} URL path to role-specific dashboard
   */
  const getDashboardLink = () => {
    const role = session.user.role;
    if (!role) return "/";
    
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "ACCOUNT_REP":
        return "/account-rep/dashboard";
      case "CLIENT":
        return "/client/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 flex items-center">
        <MobileNav />
        <nav className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 font-medium">
            <Home className="h-5 w-5" />
            <span>Kirk</span>
          </Link>
          <Link 
            href={getDashboardLink()} 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center space-x-1">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </span>
          </Link>
          <Link 
            href="/chat" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </span>
          </Link>
        </nav>
        <div className="flex items-center space-x-4 ml-auto">
          <span className="text-sm text-muted-foreground">
            {session.user.email} ({session.user.role || 'No Role'})
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => signOut()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
} 