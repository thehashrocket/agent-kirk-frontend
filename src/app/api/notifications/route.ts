/**
 * @file src/app/api/notifications/route.ts
 * API routes for managing user notifications.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Interface representing a notification in the system.
 * @property {string} id - Unique identifier for the notification
 * @property {string} userId - ID of the user the notification belongs to
 * @property {'MESSAGE_RECEIVED' | 'REPORT_GENERATED'} type - Type of notification
 * @property {string} title - Title/heading of the notification
 * @property {string} content - Main content/body of the notification
 * @property {boolean} isRead - Whether the notification has been read
 * @property {string} [link] - Optional URL associated with the notification
 * @property {Date} createdAt - When the notification was created
 */
interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE_RECEIVED' | 'REPORT_GENERATED';
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
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
 * @returns {Promise<NextResponse>} JSON response containing an array of notifications
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {404} Not Found - If user is not found in database
 * @throws {500} Internal Server Error - If there's an error processing the request
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Interface for the POST request body when creating a notification
 * @property {string} userId - ID of the user to create the notification for
 * @property {'MESSAGE_RECEIVED' | 'REPORT_GENERATED'} type - Type of notification
 * @property {string} title - Title/heading of the notification
 * @property {string} content - Main content/body of the notification
 * @property {string} [link] - Optional URL associated with the notification
 */
interface CreateNotificationBody {
  userId: string;
  type: 'MESSAGE_RECEIVED' | 'REPORT_GENERATED';
  title: string;
  content: string;
  link?: string;
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
 * @returns {Promise<NextResponse>} JSON response containing the created notification
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {403} Forbidden - If trying to create notification for another user without proper role
 * @throws {500} Internal Server Error - If there's an error processing the request
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, content, link } = body;

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
        link,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 