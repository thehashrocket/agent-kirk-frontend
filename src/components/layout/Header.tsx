'use client'
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MobileNav } from "./MobileNav";

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
      <div className="container h-16 flex items-center">
        <MobileNav />
        <div className="flex items-center gap-4 flex-1">
          <Link href={getDashboardLink()} className="font-semibold text-lg">
            Kirk
          </Link>
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {session.user.email} ({session.user.role || 'No Role'})
          </span>
        </div>
      </div>
    </header>
  );
} 