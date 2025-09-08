/**
 * @file src/app/api/account-rep/direct-mail-metrics/route.ts
 * API endpoint for fetching Direct Mail analytics metrics for account representatives.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDirectMailMetrics } from '@/lib/services/direct-mail-metrics';

/**
 * GET /api/account-rep/direct-mail-metrics
 *
 * Fetches Direct Mail analytics metrics for account representatives.
 *
 * Query Parameters:
 * - accountId: The USPS client ID
 * - clientId: The client user ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 *
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 *
 * Response:
 * - 200: Returns Direct Mail analytics metrics with tabular data
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not account rep role)
 * - 404: Account not found or not associated with client
 * - 500: Server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check account rep role
        if (session.user.role !== 'ACCOUNT_REP') {
            return NextResponse.json({ error: 'Forbidden: Account representative access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const clientId = searchParams.get('clientId');
        const fromDate = searchParams.get('from');
        const toDate = searchParams.get('to');

        if (!accountId) {
            return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
        }
        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        // Use shared service to get metrics (using clientId as the userId)
        const response = await getDirectMailMetrics({
            accountId,
            userId: clientId,
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
