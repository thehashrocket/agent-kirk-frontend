/**
 * @file src/components/layout/Sidebar.tsx
 * Desktop sidebar navigation component that provides role-based navigation.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 * 
 * Features:
 * - Role-based navigation items
 * - Active route highlighting
 * - Session management
 * - Scrollable navigation area
 * - Desktop-only display (hidden on mobile)
 */

'use client'

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart, 
  Ticket, 
  MessageSquare, 
  History,
  HelpCircle,
  FileText
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Interface for navigation items.
 * @property {string} title - Display text for the navigation item
 * @property {string} href - URL path for the navigation item
 * @property {React.ReactNode} icon - Icon component to display
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * Navigation items for admin users.
 * Includes system management and analytics links.
 */
const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "Messages", href: "/admin/messages", icon: <MessageSquare /> },
  { title: "User Management", href: "/admin/users", icon: <Users /> },
  { title: "System Settings", href: "/admin/settings", icon: <Settings /> },
  { title: "Analytics", href: "/admin/analytics", icon: <BarChart /> },
  { title: "Reports", href: "/admin/reports", icon: <FileText /> },
];

/**
 * Navigation items for account representatives.
 * Includes client management and support features.
 */
const accountRepNavItems: NavItem[] = [
  { title: "Dashboard", href: "/account-rep/dashboard", icon: <LayoutDashboard /> },
  { title: "Messages", href: "/account-rep/messages", icon: <MessageSquare /> },
  { title: "Client Management", href: "/account-rep/clients", icon: <Users /> },
  { title: "Support Tickets", href: "/account-rep/tickets", icon: <Ticket /> },
  { title: "Reports", href: "/account-rep/reports", icon: <FileText /> },
];

/**
 * Navigation items for client users.
 * Includes basic account management and support access.
 */
const clientNavItems: NavItem[] = [
  { title: "Dashboard", href: "/client/dashboard", icon: <LayoutDashboard /> },
  { title: "Messages", href: "/client/messages", icon: <MessageSquare /> },
  { title: "Query History", href: "/client/history", icon: <History /> },
  { title: "Settings", href: "/client/settings", icon: <Settings /> },
  { title: "Support", href: "/client/support", icon: <HelpCircle /> },
];

/**
 * @component Sidebar
 * Client Component that renders the desktop navigation sidebar.
 * 
 * Features:
 * - Fixed position sidebar with scroll area
 * - Role-based navigation items
 * - Active route highlighting
 * - Icon + text navigation items
 * - Desktop-only display (hidden on mobile)
 * 
 * Layout:
 * - Fixed position on left side
 * - Full height with top offset for header
 * - Consistent width (16rem/64px)
 * - Scrollable navigation area
 * 
 * Authentication:
 * - Requires active session
 * - Returns null if no session
 * 
 * Accessibility:
 * - Semantic navigation structure
 * - Clear visual hierarchy
 * - Consistent interactive states
 */
export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  /**
   * Determines the appropriate navigation items based on user role.
   * @returns {NavItem[]} Array of navigation items for the user's role
   */
  const getNavItems = () => {
    switch (session.user.role) {
      case "ADMIN":
        return adminNavItems;
      case "ACCOUNT_REP":
        return accountRepNavItems;
      case "CLIENT":
        return clientNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background">
      <ScrollArea className="h-full py-6 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
} 