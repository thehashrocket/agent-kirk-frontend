/**
 * @fileoverview Notifications API Route
 * 
 * This route handles user notification management operations:
 * - Retrieving user notifications with filtering and pagination
 * - Creating new notifications with role-based access control
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Role-based access control for notification creation
 * - Error handling with appropriate status codes
 * - Ordered retrieval by creation date
 * 
 * Endpoints:
 * - GET /api/notifications - Retrieve user notifications
 * - POST /api/notifications - Create new notification (Admin/Account Rep only)
 * 
 * @module api/notifications
 * @requires next/server
 * @requires next-auth
 * @requires @/lib/auth
 * @requires @/lib/prisma
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Interface representing a notification in the system.
 * @interface Notification
 * @property {string} id - Unique identifier for the notification
 * @property {string} userId - ID of the user the notification belongs to
 * @property {'MESSAGE_RECEIVED' | 'REPORT_GENERATED'} type - Type of notification
 * @property {string} title - Title/heading of the notification
 * @property {string} content - Main content/body of the notification
 * @property {boolean} isRead - Whether the notification has been read
 * @property {string} [link] - Optional URL associated with the notification
 * @property {Date} createdAt - When the notification was created
 */

/**
 * Interface for the POST request body when creating a notification
 * @interface CreateNotificationBody
 * @property {string} userId - ID of the user to create the notification for
 * @property {'MESSAGE_RECEIVED' | 'REPORT_GENERATED'} type - Type of notification
 * @property {string} title - Title/heading of the notification
 * @property {string} content - Main content/body of the notification
 */
interface CreateNotificationBody {
  userId: string;
  type: 'MESSAGE_RECEIVED' | 'REPORT_GENERATED';
  title: string;
  content: string;
}

/**
 * GET /api/notifications
 * 
 * Retrieves all notifications for the authenticated user.
 * Notifications are ordered by creation date in descending order (newest first).
 * 
 * @route GET /api/notifications
 * 
 * @security
 * - Requires authentication via NextAuth session
 * - User must exist in the database
 * 
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - 200: Array of notifications
 *   - 401: Unauthorized error if no valid session exists
 *   - 404: Not Found if user is not found in database
 *   - 500: Internal Server Error if database operation fails
 */
export async function GET() {
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

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 
 * Creates a new notification for a user.
 * Only admins and account representatives can create notifications for other users.
 * Regular users can only create notifications for themselves.
 * 
 * @route POST /api/notifications
 * 
 * @security
 * - Requires authentication via NextAuth session
 * - Role-based access control for creating notifications for other users
 * 
 * @param {Request} req - The request object
 * @param {CreateNotificationBody} req.body - The request body containing notification data
 * 
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - 200: The created notification object
 *   - 401: Unauthorized error if no valid session exists
 *   - 403: Forbidden if trying to create notification for another user without proper role
 *   - 500: Internal Server Error if database operation fails
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, content } = body;

    // Only allow creating notifications for other users if you're an admin or account rep
    if (userId !== session.user.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      });

      if (!currentUser?.role || !['ADMIN', 'ACCOUNT_REP'].includes(currentUser.role.name)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 