/**
 * @file src/app/admin/tickets/page.tsx
 * Admin support tickets management page.
 * Provides a comprehensive interface for managing and monitoring support tickets.
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketList from "@/components/tickets/TicketList";
import TicketFilters from "@/components/tickets/TicketFilters";

export const metadata: Metadata = {
  title: "Support Tickets | Admin Dashboard",
  description: "Manage and monitor support tickets across the platform",
};

/**
 * @component AdminTicketsPage
 * Server Component that renders the main support ticket management interface.
 * Features:
 * - Filterable list of all support tickets
 * - Status-based tabs (All, Open, In Progress, Resolved)
 * - Priority-based filtering
 * - Quick actions for ticket management
 */
export default async function AdminTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <div className="flex items-center space-x-4">
          {/* Stats summary */}
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">Open Tickets</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
          <Card className="p-3">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <Card className="md:col-span-1 p-4">
          <TicketFilters />
        </Card>

        {/* Main content area */}
        <div className="md:col-span-3">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TicketList status="all" />
            </TabsContent>
            <TabsContent value="open">
              <TicketList status="OPEN" />
            </TabsContent>
            <TabsContent value="in-progress">
              <TicketList status="IN_PROGRESS" />
            </TabsContent>
            <TabsContent value="resolved">
              <TicketList status="RESOLVED" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 