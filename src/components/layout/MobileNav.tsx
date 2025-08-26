/**
 * @file src/components/layout/MobileNav.tsx
 * Mobile navigation component that provides a responsive slide-out menu.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 *
 * Features:
 * - Role-based navigation items
 * - Slide-out sheet interface
 * - Active route highlighting
 * - Session management
 * - Responsive design (hidden on desktop)
 */

'use client'

import * as React from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart,
  MessageSquare,
  FileText,
} from "lucide-react"

/**
 * Interface for navigation items.
 * @property {string} title - Display text for the navigation item
 * @property {string} href - URL path for the navigation item
 * @property {React.ReactNode} icon - Icon component to display
 */
interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

/**
 * Navigation items for admin users.
 * Includes system management and analytics links.
 */
const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "User Management", href: "/admin/users", icon: <Users /> },
  { title: "System Settings", href: "/admin/settings", icon: <Settings /> },
  { title: "Client Analytics", href: "/admin/client-analytics", icon: <BarChart /> },
  { title: "Reports", href: "/admin/reports", icon: <FileText /> },
  // { title: "Messages", href: "/admin/messages", icon: <MessageSquare /> },
]

/**
 * Navigation items for account representatives.
 * Includes client management and support features.
 */
const accountRepNavItems: NavItem[] = [
  { title: "Dashboard", href: "/account-rep/dashboard", icon: <LayoutDashboard /> },
  { title: "Client Management", href: "/account-rep/clients", icon: <Users /> },
  { title: "Client Analytics", href: "/account-rep/client-analytics", icon: <BarChart /> },
  // { title: "Messages", href: "/account-rep/messages", icon: <MessageSquare /> },
  { title: "Reports", href: "/account-rep/reports", icon: <FileText /> },
  { title: "Chat", href: "/chat", icon: <MessageSquare /> },
]

/**
 * Navigation items for client users.
 * Includes basic account management and support access.
 */
const clientNavItems: NavItem[] = [
  { title: "Dashboard", href: "/client/dashboard", icon: <LayoutDashboard /> },
  // { title: "Messages", href: "/client/messages", icon: <MessageSquare /> },
  // { title: "Settings", href: "/client/settings", icon: <Settings /> },
  // { title: "Support", href: "/client/support", icon: <HelpCircle /> },
  { title: "Chat", href: "/chat", icon: <MessageSquare /> },
]

/**
 * @component MobileNav
 * Client Component that renders a mobile-friendly navigation menu.
 *
 * Features:
 * - Slide-out sheet interface using shadcn/ui
 * - Role-based navigation items
 * - Active route highlighting
 * - Session information display
 * - Scrollable navigation area
 *
 * Layout:
 * - Hidden on desktop (lg:hidden)
 * - Full-height sheet with scroll area
 * - Consistent spacing and typography
 * - Icon + text navigation items
 *
 * Authentication:
 * - Requires active session
 * - Displays user email and role
 * - Returns null if no session
 *
 * Accessibility:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Clear visual hierarchy
 */
export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) return null

  /**
   * Determines the appropriate navigation items based on user role.
   * @returns {NavItem[]} Array of navigation items for the user's role
   */
  const getNavItems = () => {
    switch (session.user.role) {
      case "ADMIN":
        return adminNavItems
      case "ACCOUNT_REP":
        return accountRepNavItems
      case "CLIENT":
        return clientNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <ScrollArea className="h-full py-6 px-3">
          <div className="mb-4 px-3">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <p className="text-xs text-muted-foreground">
              {session.user.role || 'No Role'}
            </p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:font-bliss-bold",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}