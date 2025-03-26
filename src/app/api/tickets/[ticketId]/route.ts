/**
 * @file src/app/api/tickets/[ticketId]/route.ts
 * API routes for individual ticket operations
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTicketById, updateTicket } from "@/lib/services/ticket-service";
import { z } from "zod";

// Schema for ticket updates
const updateTicketSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedToId: z.string().min(1, "Assignee ID is required").nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.ticketId) {
      return new NextResponse("Ticket ID is required", { status: 400 });
    }

    const ticket = await getTicketById(params.ticketId);

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.ticketId) {
      return new NextResponse("Ticket ID is required", { status: 400 });
    }

    const json = await request.json();
    const body = updateTicketSchema.parse(json);

    const ticket = await updateTicket(params.ticketId, body);

    return NextResponse.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    console.error("[TICKET_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 