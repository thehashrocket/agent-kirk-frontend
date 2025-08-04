/**
 * @file src/app/api/admin/available-usps-clients/route.ts
 * API endpoint for fetching available USPS Clients that can be assigned to clients.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/available-usps-clients
 *
 * Fetches all available USPS Clients that can be assigned to clients.
 *
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 *
 * Response:
 * - 200: Returns array of available Email Clients
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not admin/account rep role)
 * - 500: Server error
 */

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin/account rep role
        if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNT_REP') {
            return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
        }

        // Fetch all USPS Clients
        const uspsClients = await prisma.uspsClient.findMany({
            orderBy: [
                { clientName: 'asc' }
            ],
            include: {
                uspsCampaigns: {
                    select: {
                        id: true,
                        campaignName: true,
                    },
                }
            },
        });

        return NextResponse.json(uspsClients);
    } catch (error) {
        console.error('Error fetching available USPS clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}