/**
 * @file src/app/api/client/direct-mail-accounts/route.ts
 *  API endpoint for fetching Direct Mail accounts associated with the current client user.
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/direct-mail-accounts
 *
 * Fetches Direct Mail accounts associated with the current client user.
 * Direct Mail accounts are stored in the UserToUspsClient relation.
 *
 * Authentication:
 * - Requires valid session with CLIENT role
 *
 * Response:
 * - 200: Returns array of Direct Mail accounts associated with the user
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        // Get clientId from the clientId parameter in the URL
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Check authentication
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check client role
        if (session.user.role !== 'ACCOUNT_REP') {
            return NextResponse.json({ error: 'Forbidden: Account Rep access required' }, { status: 403 });
        }

        // Fetch user's Direct Mail accounts (USPS clients)
        const userWithUspsClients = await prisma.user.findUnique({
            where: { id: clientId },
            include: {
                uspsClients: {
                    include: {
                        uspsClient: true,
                    },
                },
            },
        });

        if (!userWithUspsClients) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Transform the data to return just the Direct Mail accounts (USPS clients)
        const directMailAccounts = userWithUspsClients.uspsClients.map(
            ({ uspsClient }) => uspsClient
        );

        console.log('Direct Mail accounts fetched:', directMailAccounts);

        return NextResponse.json(directMailAccounts);
    } catch (error) {
        console.error('Error fetching client Direct Mail accounts:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
