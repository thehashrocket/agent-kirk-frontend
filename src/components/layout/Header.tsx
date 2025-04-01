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
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import { UserProfileBadge } from "./UserProfileBadge";
/**
 * @component Header
 * Client Component that renders the main navigation header.
 * 
 * Features:
 * - Responsive navigation with mobile menu
 * - Role-based dashboard links
 * - Session status display
 * - Logout functionality
 * - Sticky positioning with gradient background
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
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 flex items-center">
        <MobileNav />
        <nav className="flex items-center space-x-6">
          <Link 
            href="/" 
            className="flex items-center space-x-2 font-medium text-primary hover:text-primary/90 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-bliss-bold text-lg">Kirk</span>
          </Link>
          <Link 
            href={getDashboardLink()} 
            className={cn(
              "text-sm transition-colors hover:text-primary",
              "flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-primary/10"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/chat" 
            className={cn(
              "text-sm transition-colors hover:text-primary",
              "flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-primary/10"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </Link>
        </nav>
        <div className="flex items-center space-x-4 ml-auto">
          <NotificationBell />
          <UserProfileBadge />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => signOut()}
            className={cn(
              "text-sm transition-colors",
              "flex items-center space-x-1 hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
} 