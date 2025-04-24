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
  FileText,
  User
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Interface for navigation items.
 * @property {string} title - Display text for the navigation item
 * @property {string} href - URL path for the navigation item
 * @property {React.ReactNode} icon - Icon component to display
 * @property {string} [description] - Optional description for the navigation item
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

/**
 * Navigation items for admin users.
 * Includes system management and analytics links.
 */
const adminNavItems: NavItem[] = [
  { 
    title: "Dashboard", 
    href: "/admin/dashboard", 
    icon: <LayoutDashboard />,
    description: "Overview and key metrics"
  },
  { 
    title: "User Management", 
    href: "/admin/users", 
    icon: <Users />,
    description: "Manage user accounts"
  },
  { 
    title: "System Settings", 
    href: "/admin/settings", 
    icon: <Settings />,
    description: "Configure system preferences"
  },
  { 
    title: "Analytics", 
    href: "/admin/analytics", 
    icon: <BarChart />,
    description: "System performance metrics"
  },
  { 
    title: "Reports", 
    href: "/admin/reports", 
    icon: <FileText />,
    description: "Generate system reports"
  },
  { 
    title: "Messages", 
    href: "/admin/messages", 
    icon: <MessageSquare />,
    description: "System-wide communications"
  },
];

/**
 * Navigation items for account representatives.
 * Includes client management and support features.
 */
const accountRepNavItems: NavItem[] = [
  { 
    title: "Dashboard", 
    href: "/account-rep/dashboard", 
    icon: <LayoutDashboard />,
    description: "Client overview"
  },
  { 
    title: "Client Management", 
    href: "/account-rep/clients", 
    icon: <Users />,
    description: "Manage client accounts"
  },
  // { 
  //   title: "Need Help?", 
  //   href: "/account-rep/tickets", 
  //   icon: <Ticket />,
  //   description: "Handle support requests"
  // },
  { 
    title: "Messages", 
    href: "/account-rep/messages", 
    icon: <MessageSquare />,
    description: "Client communications"
  },
  { 
    title: "Reports", 
    href: "/account-rep/reports", 
    icon: <FileText />,
    description: "Client activity reports"
  },
  {
    title: "Profile",
    href: "/account-rep/profile",
    icon: <User />,
    description: "Manage your account"
  },
];

/**
 * Navigation items for client users.
 * Includes basic account management and support access.
 */
const clientNavItems: NavItem[] = [
  { 
    title: "Dashboard", 
    href: "/client/dashboard", 
    icon: <LayoutDashboard />,
    description: "Your overview"
  },
  { 
    title: "Messages", 
    href: "/client/messages", 
    icon: <MessageSquare />,
    description: "Your conversations"
  },
  // { 
  //   title: "Settings", 
  //   href: "/client/settings", 
  //   icon: <Settings />,
  //   description: "Account preferences"
  // },
  // { 
  //   title: "Support", 
  //   href: "/client/support", 
  //   icon: <HelpCircle />,
  //   description: "Get assistance"
  // },
  {
    title: "Profile",
    href: "/client/profile",
    icon: <User />,
    description: "Manage your account"
  },
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
    <aside className="hidden lg:block fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] border-r bg-gradient-to-b from-background to-primary/5">
      <ScrollArea className="h-full py-6">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex flex-col gap-1 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-primary/10",
                  pathname === item.href ? 
                    "bg-primary/15 text-primary" : 
                    "text-muted-foreground hover:text-primary"
                )}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-4 w-4 transition-colors",
                    pathname === item.href ? 
                      "text-primary" : 
                      "text-muted-foreground group-hover:text-primary"
                  )}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.title}</span>
                </div>
                {item.description && (
                  <span className="line-clamp-2 text-xs text-muted-foreground group-hover:text-primary/80">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
} 