'use client'
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { Home, MessageSquare, LogOut, LayoutDashboard } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) return null;

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