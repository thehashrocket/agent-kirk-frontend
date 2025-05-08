/**
 * @fileoverview API routes for individual ticket operations in the ticketing system.
 * Provides endpoints for retrieving and updating individual tickets.
 * 
 * Authentication:
 * All endpoints require a valid session token obtained through NextAuth.
 * Include the session token in the request cookies.
 * 
 * Rate Limiting:
 * These endpoints are subject to the global API rate limit of 100 requests per minute per IP.
 * 
 * @module api/tickets/[ticketId]
 * @requires next/server
 * @requires next-auth
 * @requires @/lib/auth
 * @requires @/lib/services/ticket-service
 * @requires zod
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTicketById, updateTicket } from "@/lib/services/ticket-service";
import { z } from "zod";

/**
 * Schema for validating ticket update requests.
 * All fields are optional to allow partial updates.
 * 
 * @typedef {Object} UpdateTicketSchema
 * @property {string} [title] - The ticket title (minimum 1 character)
 * @property {string} [description] - The ticket description (minimum 1 character)
 * @property {'OPEN' | 'IN_PROGRESS' | 'RESOLVED'} [status] - The ticket status
 * @property {'LOW' | 'MEDIUM' | 'HIGH'} [priority] - The ticket priority level
 * @property {string | null} [assignedToId] - The ID of the assigned user (nullable)
 * 
 * @example
 * // Complete ticket update
 * {
 *   "title": "Fix login bug",
 *   "description": "Users unable to login with Google SSO",
 *   "status": "IN_PROGRESS",
 *   "priority": "HIGH",
 *   "assignedToId": "user_123"
 * }
 * 
 * @example
 * // Partial ticket update (status only)
 * {
 *   "status": "RESOLVED"
 * }
 * 
 * @example
 * // Remove assignee
 * {
 *   "assignedToId": null
 * }
 */
const updateTicketSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedToId: z.string().min(1, "Assignee ID is required").nullable().optional(),
});

/**
 * Retrieves a specific ticket by ID.
 * 
 * @async
 * @param {Request} request - The incoming HTTP request
 * @param {Object} params - URL parameters
 * @param {string} params.ticketId - The ID of the ticket to retrieve
 * @returns {Promise<NextResponse>} The ticket data or error response
 * 
 * @example
 * // Successful Response (200 OK)
 * {
 *   "id": "ticket_123",
 *   "title": "Fix login bug",
 *   "description": "Users unable to login with Google SSO",
 *   "status": "IN_PROGRESS",
 *   "priority": "HIGH",
 *   "assignedToId": "user_123",
 *   "createdAt": "2024-01-01T00:00:00.000Z",
 *   "updatedAt": "2024-01-02T00:00:00.000Z"
 * }
 * 
 * Error Responses:
 * @throws {NextResponse} 401 - Unauthorized
 * {
 *   "error": "Unauthorized",
 *   "message": "Authentication required"
 * }
 * @throws {NextResponse} 400 - Bad Request
 * {
 *   "error": "Bad Request",
 *   "message": "Ticket ID is required"
 * }
 * @throws {NextResponse} 404 - Not Found
 * {
 *   "error": "Not Found",
 *   "message": "Ticket not found"
 * }
 * @throws {NextResponse} 500 - Internal Server Error
 * {
 *   "error": "Internal Server Error",
 *   "message": "An unexpected error occurred"
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required"
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { ticketId } = await params;

    if (!ticketId) {
      return new NextResponse(
        JSON.stringify({
          error: "Bad Request",
          message: "Ticket ID is required"
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return new NextResponse(
        JSON.stringify({
          error: "Not Found",
          message: "Ticket not found"
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[TICKET_GET]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred"
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Updates a specific ticket by ID.
 * Supports partial updates of ticket properties.
 * 
 * @async
 * @param {Request} request - The incoming HTTP request with JSON body matching UpdateTicketSchema
 * @param {Object} params - URL parameters
 * @param {string} params.ticketId - The ID of the ticket to update
 * @returns {Promise<NextResponse>} The updated ticket data or error response
 * 
 * @example
 * // Request Body
 * {
 *   "status": "RESOLVED",
 *   "priority": "LOW"
 * }
 * 
 * @example
 * // Successful Response (200 OK)
 * {
 *   "id": "ticket_123",
 *   "title": "Fix login bug",
 *   "status": "RESOLVED",
 *   "priority": "LOW",
 *   // ... other ticket fields
 * }
 * 
 * Error Responses:
 * @throws {NextResponse} 401 - Unauthorized
 * {
 *   "error": "Unauthorized",
 *   "message": "Authentication required"
 * }
 * @throws {NextResponse} 400 - Bad Request
 * {
 *   "error": "Bad Request",
 *   "errors": [
 *     {
 *       "code": "invalid_enum_value",
 *       "path": ["status"],
 *       "message": "Invalid status value"
 *     }
 *   ]
 * }
 * @throws {NextResponse} 500 - Internal Server Error
 * {
 *   "error": "Internal Server Error",
 *   "message": "An unexpected error occurred"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required"
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const json = await request.json();
    const body = updateTicketSchema.parse(json);

    const { ticketId } = await params;
    const ticket = await updateTicket(ticketId, body);

    return NextResponse.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: "Bad Request",
          errors: error.errors
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.error("[TICKET_PATCH]", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred"
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 