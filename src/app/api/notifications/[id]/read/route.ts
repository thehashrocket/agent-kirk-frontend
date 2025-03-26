/**
 * API Route: POST /api/notifications/[id]/read
 * 
 * Marks a specific notification as read for the authenticated user.
 * This endpoint ensures that users can only mark their own notifications as read.
 * 
 * @route POST /api/notifications/[id]/read
 * @param {string} id - The ID of the notification to mark as read (from URL parameter)
 * 
 * @security
 * - Requires authentication via NextAuth session
 * - Verifies notification ownership before updating
 * 
 * @returns {Promise<NextResponse>} JSON response containing the updated notification
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {404} Not Found - If user or notification is not found
 * @throws {404} Not Found - If notification doesn't belong to the authenticated user
 * @throws {500} Internal Server Error - If there's an error processing the request
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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