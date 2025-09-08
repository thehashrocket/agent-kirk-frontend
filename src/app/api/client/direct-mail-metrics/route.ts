/**
 * @file src/app/api/client/direct-mail-metrics/route.ts
 * API endpoint for fetching Direct Mail analytics metrics for the current client user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDirectMailMetrics } from '@/lib/services/direct-mail-metrics';

/**
 * GET /api/client/direct-mail-metrics
 *
 * Fetches Direct Mail analytics metrics for the current client user.
 *
 * Query Parameters:
 * - accountId: The USPS client ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 *
 * Authentication:
 * - Requires valid session with CLIENT role
 *
 * Response:
 * - 200: Returns Direct Mail analytics metrics with tabular data
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 404: Account not found or not associated with user
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check client role
        if (session.user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Forbidden: Client access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }

        // Use shared service to get metrics
        const response = await getDirectMailMetrics({
            accountId,
            userId: session.user.id,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching Direct Mail metrics:', error);

        // Handle specific error from service
        if (error instanceof Error && error.message === 'Direct Mail account not found or not accessible') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
