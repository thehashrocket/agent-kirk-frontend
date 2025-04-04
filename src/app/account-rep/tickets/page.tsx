/**
 * @file src/app/account-rep/tickets/page.tsx
 * Account Representative tickets management page.
 * Provides an interface for managing and monitoring client support tickets.
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketList from "@/components/tickets/TicketList";
import TicketFilters from "@/components/tickets/TicketFilters";
import { TicketStats } from "@/components/tickets/TicketStats";

export const metadata: Metadata = {
  title: "Client Tickets | Account Representative Dashboard",
  description: "Manage and monitor your clients' support tickets",
};

/**
 * @component AccountRepTicketsPage
 * Server Component that renders the ticket management interface for account representatives.
 * Features:
 * - Filterable list of client support tickets
 * - Status-based tabs (All, Open, In Progress, Resolved)
 * - Client and priority-based filtering
 * - Quick actions for ticket management
 */
export default async function AccountRepTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ACCOUNT_REP") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Client Support Tickets</h1>
        <TicketStats accountRepId={session.user.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <Card className="md:col-span-1 p-4">
          <TicketFilters showClientFilter={true} accountRepId={session.user.id} />
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
              <TicketList status="all" accountRepId={session.user.id} />
            </TabsContent>
            <TabsContent value="open">
              <TicketList status="OPEN" accountRepId={session.user.id} />
            </TabsContent>
            <TabsContent value="in-progress">
              <TicketList status="IN_PROGRESS" accountRepId={session.user.id} />
            </TabsContent>
            <TabsContent value="resolved">
              <TicketList status="RESOLVED" accountRepId={session.user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
