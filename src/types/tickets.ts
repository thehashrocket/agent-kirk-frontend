/**
 * @file src/types/tickets.ts
 * Shared type definitions for the support ticket system
 */

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];
  tags?: string[];
}

export interface TicketFilters {
  search: string;
  priority: string;
  assignee: string;
  dateRange: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  averageResponseTime: number; // in hours
} 