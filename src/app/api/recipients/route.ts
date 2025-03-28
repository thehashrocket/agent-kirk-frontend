/**
 * @fileoverview Recipients API Route
 * 
 * This route handles fetching available message recipients based on user roles:
 * - ADMIN can message everyone except themselves
 * - ACCOUNT_REP can message CLIENT users
 * - CLIENT can message ACCOUNT_REP users
 * 
 * All recipients must be active users in the system.
 * 
 * @route GET /api/recipients
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Type definition for user roles in the system
 */
type UserRole = 'ADMIN' | 'ACCOUNT_REP' | 'CLIENT';

/**
 * Interface for recipient objects returned by the GET endpoint
 * @property {string} id - Unique identifier for the recipient
 * @property {string | null} name - Display name of the recipient
 */
interface Recipient {
  id: string;
  name: string | null;
}

/**
 * GET handler for fetching available message recipients
 * Returns a filtered list of recipients based on the user's role
 * 
 * @returns {Promise<NextResponse>} JSON response containing array of recipients
 * 
 * @throws {401} If user is not authenticated
 * @throws {500} If there's an internal server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let recipients: Recipient[] = [];
    const userRole = session.user.role as UserRole;

    // If user is an ACCOUNT_REP, they can message clients
    if (userRole === 'ACCOUNT_REP') {
      recipients = await prisma.user.findMany({
        where: {
          role: {
            name: 'CLIENT'
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    // If user is a CLIENT, they can message account reps
    else if (userRole === 'CLIENT') {
      recipients = await prisma.user.findMany({
        where: {
          role: {
            name: 'ACCOUNT_REP'
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }
    // If user is an ADMIN, they can message everyone
    else if (userRole === 'ADMIN') {
      recipients = await prisma.user.findMany({
        where: {
          isActive: true,
          NOT: {
            id: session.user.id, // Exclude self
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return NextResponse.json(recipients);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 