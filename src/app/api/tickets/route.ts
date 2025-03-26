/**
 * @file src/app/api/tickets/route.ts
 * API routes for ticket management
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTicket, getTickets } from "@/lib/services/ticket-service";
import { z } from "zod";

// Schema for ticket creation
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  clientId: z.string().min(1, "Client ID is required"),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | undefined;
    const priority = searchParams.get("priority") as "LOW" | "MEDIUM" | "HIGH" | undefined;
    const assignedToId = searchParams.get("assignedToId") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const search = searchParams.get("search") || undefined;

    const tickets = await getTickets({
      status,
      priority,
      assignedToId,
      clientId,
      search,
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("[TICKETS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const body = createTicketSchema.parse(json);

    const ticket = await createTicket(body);

    return NextResponse.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    console.error("[TICKETS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 