/**
 * @fileoverview Notification Read Status API Route
 * 
 * This route handles marking individual notifications as read in the system.
 * It provides a single endpoint for updating the read status of notifications
 * with proper authentication and authorization checks.
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Authorization checks to ensure users can only mark their own notifications
 * - Database persistence using Prisma
 * - Comprehensive error handling with appropriate status codes
 * 
 * @route POST /api/notifications/[id]/read - Mark a notification as read
 * @security Requires authentication via NextAuth session
 * 
 * @param {string} id - The ID of the notification to mark as read (from URL parameter)
 * 
 * @returns {Object} The updated notification object
 * @throws {401} Unauthorized - If no valid session exists
 * @throws {404} Not Found - If notification doesn't exist or user is unauthorized
 * @throws {500} Internal Server Error - If database operation fails
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Marks a notification as read for the authenticated user.
 * Ensures that users can only mark their own notifications as read.
 * 
 * @param {Request} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.id - The ID of the notification to mark as read
 * 
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - 200: The updated notification object
 *   - 401: Unauthorized if no valid session exists
 *   - 404: Not Found if notification doesn't exist or user is unauthorized
 *   - 500: Internal Server Error if operation fails
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: No valid session found' }), 
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found in database' }), 
        { status: 404 }
      );
    }

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!notification) {
      return new NextResponse(
        JSON.stringify({ error: 'Notification not found or does not belong to user' }), 
        { status: 404 }
      );
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
} 