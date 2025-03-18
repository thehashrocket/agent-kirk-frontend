'use client'
import { useSession } from "next-auth/react";
import Link from "next/link";
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
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">
            Kirk
          </Link>
          <span className="text-sm text-muted-foreground">
            {session.user.email} ({session.user.role || 'No Role'})
          </span>
        </div>
        <nav>
          <Button variant="ghost" asChild>
            <Link href={getDashboardLink()}>Dashboard</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
} 