/**
 * @fileoverview Tickets API Route
 * 
 * This route handles ticket management operations in the system:
 * - Creating new tickets with validation
 * - Retrieving tickets with filtering options
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Request validation using Zod schemas
 * - Support for filtering by status, priority, assignment, and search
 * - Error handling with appropriate status codes
 * 
 * @route GET /api/tickets - Retrieve filtered tickets
 * @route POST /api/tickets - Create a new ticket
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTicket, getTickets } from "@/lib/services/ticket-service";
import { z } from "zod";

/**
 * Schema for validating ticket creation requests
 * @typedef {Object} CreateTicketSchema
 * @property {string} title - The ticket title (minimum 1 character)
 * @property {string} description - The ticket description (minimum 1 character)
 * @property {'LOW' | 'MEDIUM' | 'HIGH'} priority - The ticket priority level
 * @property {string} clientId - The ID of the client the ticket is for
 */
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  clientId: z.string().min(1, "Client ID is required"),
});

/**
 * GET handler for retrieving tickets with optional filters
 * 
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing filtered tickets
 * 
 * @example
 * // Request with filters:
 * GET /api/tickets?status=OPEN&priority=HIGH&clientId=123
 * 
 * @throws {401} If user is not authenticated
 * @throws {500} If server encounters an error
 */
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
    const accountRepId = searchParams.get("accountRepId") || undefined;
    const search = searchParams.get("search") || undefined;

    // If the user is an account rep, we need to ensure they can only see their clients' tickets
    if (session.user.role === "ACCOUNT_REP") {
      const tickets = await getTickets({
        status,
        priority,
        assignedToId,
        clientId,
        accountRepId: session.user.id, // Force accountRepId to be the current user's ID
        search,
      });
      return NextResponse.json(tickets);
    }

    // For other roles (like admin), allow them to see all tickets
    const tickets = await getTickets({
      status,
      priority,
      assignedToId,
      clientId,
      accountRepId,
      search,
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("[TICKETS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * POST handler for creating new tickets
 * 
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing the created ticket
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If request body is invalid
 * @throws {500} If server encounters an error
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    // If the user is an account rep, ensure they can only create tickets for their clients
    if (session.user.role === "ACCOUNT_REP") {
      // TODO: Add validation to ensure the client belongs to this account rep
      // This should be done in the ticket service
    }

    const ticket = await createTicket(validatedData);
    return NextResponse.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }

    console.error("[TICKETS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 