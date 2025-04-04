/**
 * @file src/hooks/use-tickets.ts
 * Custom hook for managing tickets
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/tickets";

interface UseTicketsProps {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  clientId?: string;
  accountRepId?: string;
  search?: string;
}

interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  clientId: string;
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

async function fetchTickets(params: UseTicketsProps) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.assignedToId) searchParams.set("assignedToId", params.assignedToId);
  if (params.clientId) searchParams.set("clientId", params.clientId);
  if (params.accountRepId) searchParams.set("accountRepId", params.accountRepId);
  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/tickets?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return response.json();
}

async function fetchTicketById(id: string) {
  const response = await fetch(`/api/tickets/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch ticket");
  }
  return response.json();
}

async function updateTicket(id: string, data: UpdateTicketData) {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update ticket");
  }
  return response.json();
}

export function useTickets(props: UseTicketsProps = {}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: tickets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tickets", props],
    queryFn: () => fetchTickets(props),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketData }) =>
      updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    tickets,
    isLoading,
    error,
    refetch,
    updateTicket: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export function useTicket(id: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: ticket,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicketById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTicketData) => updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    ticket,
    isLoading,
    error,
    refetch,
    updateTicket: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}