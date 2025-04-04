/**
 * @file src/app/account-rep/tickets/[ticketId]/page.tsx
 * Account Representative ticket detail page.
 * Provides a detailed view of a specific ticket with management capabilities.
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTicketById } from "@/lib/services/ticket-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TicketDetailPageProps {
  params: {
    ticketId: string;
  };
}

export async function generateMetadata({ params }: TicketDetailPageProps): Promise<Metadata> {
  const ticket = await getTicketById(params.ticketId);
  return {
    title: ticket ? `Ticket: ${ticket.title} | Account Representative Dashboard` : "Ticket Not Found",
    description: ticket?.description || "Ticket details page",
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ACCOUNT_REP") {
    redirect("/auth/signin");
  }

  const ticket = await getTicketById(params.ticketId);

  if (!ticket) {
    redirect("/account-rep/tickets");
  }

  // Ensure the account rep can only view tickets from their clients
  if (ticket.client.accountRepId !== session.user.id) {
    redirect("/account-rep/tickets");
  }

  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800",
  } as const;

  const statusColors = {
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    RESOLVED: "bg-green-100 text-green-800",
  } as const;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/account-rep/tickets"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Opened by {ticket.client.name} on {formatDate(ticket.createdAt.toString())}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={statusColors[ticket.status]}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge className={priorityColors[ticket.priority]}>
                {ticket.priority.toLowerCase()} priority
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="prose max-w-none dark:prose-invert">
            <p>{ticket.description}</p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Attachments</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {ticket.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 rounded-lg border p-2 hover:bg-muted"
                  >
                    <span className="truncate">{attachment.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {ticket.comments && ticket.comments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comments</h3>
              <div className="space-y-4">
                {ticket.comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {comment.author.image && (
                            <img
                              src={comment.author.image}
                              alt={comment.author.name || ""}
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">{comment.author.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(comment.createdAt.toString())}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 