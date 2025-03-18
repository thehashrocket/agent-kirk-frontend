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
  Ticket,
  MessageSquare,
  History,
  HelpCircle,
  FileText,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard /> },
  { title: "User Management", href: "/admin/users", icon: <Users /> },
  { title: "System Settings", href: "/admin/settings", icon: <Settings /> },
  { title: "Analytics", href: "/admin/analytics", icon: <BarChart /> },
  { title: "Reports", href: "/admin/reports", icon: <FileText /> },
]

const accountRepNavItems: NavItem[] = [
  { title: "Dashboard", href: "/account-rep/dashboard", icon: <LayoutDashboard /> },
  { title: "Client Management", href: "/account-rep/clients", icon: <Users /> },
  { title: "Support Tickets", href: "/account-rep/tickets", icon: <Ticket /> },
  { title: "Messages", href: "/account-rep/messages", icon: <MessageSquare /> },
  { title: "Reports", href: "/account-rep/reports", icon: <FileText /> },
]

const clientNavItems: NavItem[] = [
  { title: "Dashboard", href: "/client/dashboard", icon: <LayoutDashboard /> },
  { title: "Query History", href: "/client/history", icon: <History /> },
  { title: "Settings", href: "/client/settings", icon: <Settings /> },
  { title: "Support", href: "/client/support", icon: <HelpCircle /> },
]

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) return null

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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
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