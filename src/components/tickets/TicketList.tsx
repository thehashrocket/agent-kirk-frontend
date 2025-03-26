'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Clock, User } from "lucide-react";
import type { TicketStatus, TicketPriority, Ticket } from "@/types/tickets";
import { useTickets } from "@/hooks/use-tickets";

interface TicketListProps {
  status?: TicketStatus | "all";
  priority?: TicketPriority;
  assignedToId?: string;
  clientId?: string;
  search?: string;
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

export default function TicketList({
  status = "all",
  priority,
  assignedToId,
  clientId,
  search,
}: TicketListProps) {
  const {
    tickets,
    isLoading,
    error,
    updateTicket,
    isUpdating,
  } = useTickets({
    status: status === "all" ? undefined : status,
    priority,
    assignedToId,
    clientId,
    search,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col space-y-3 p-6">
              <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="flex space-x-2">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-red-500">
          <p>Error loading tickets: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No tickets found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket: Ticket) => (
        <Card key={ticket.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base">
                <Link 
                  href={`/admin/tickets/${ticket.id}`}
                  className="hover:underline"
                >
                  {ticket.title}
                </Link>
              </CardTitle>
              <CardDescription>{ticket.client.name}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (!ticket.assignedTo) {
                      updateTicket({
                        id: ticket.id,
                        data: { assignedToId: "current-user-id" }, // TODO: Get from session
                      });
                    }
                  }}
                  disabled={isUpdating || !!ticket.assignedTo}
                >
                  {ticket.assignedTo ? "Already assigned" : "Assign to me"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const newStatus = ticket.status === "OPEN" ? "IN_PROGRESS" : "RESOLVED";
                    updateTicket({
                      id: ticket.id,
                      data: { status: newStatus },
                    });
                  }}
                  disabled={isUpdating || ticket.status === "RESOLVED"}
                >
                  {ticket.status === "OPEN"
                    ? "Mark as In Progress"
                    : ticket.status === "IN_PROGRESS"
                    ? "Mark as Resolved"
                    : "Already Resolved"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {ticket.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                {ticket.priority.toLowerCase()} priority
              </Badge>
              <div className="flex items-center text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {formatDate(ticket.updatedAt)}
                </span>
              </div>
              {ticket.assignedTo && (
                <div className="flex items-center text-muted-foreground">
                  <User className="mr-1 h-3 w-3" />
                  <span>{ticket.assignedTo.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 