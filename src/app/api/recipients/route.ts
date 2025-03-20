import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type UserRole = 'ADMIN' | 'ACCOUNT_REP' | 'CLIENT';

interface Recipient {
  id: string;
  name: string | null;
}

/**
 * GET /api/recipients
 * Returns a list of available recipients based on the user's role
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