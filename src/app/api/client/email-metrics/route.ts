/**
 * @file src/app/api/client/email-metrics/route.ts
 * API endpoint for fetching email analytics metrics for the current client user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmailMetrics } from '@/lib/services/email-metrics';

/**
 * GET /api/client/email-metrics
 *
 * Fetches email analytics metrics for the current client user.
 *
 * Query Parameters:
 * - emailClientId: The Email Client ID
 * - from: Start date (YYYY-MM-DD format)
 * - to: End date (YYYY-MM-DD format)
 * - selectedFrom: Original selected start date for display
 * - selectedTo: Original selected end date for display
 *
 * Authentication:
 * - Requires valid session with CLIENT role
 *
 * Response:
 * - 200: Returns email analytics metrics
 * - 401: Unauthorized (not logged in)
 * - 403: Forbidden (not client role)
 * - 400: Missing required parameters
 * - 404: Email Client not found or not associated with user
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
    const emailClientId = searchParams.get('emailClientId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const selectedFrom = searchParams.get('selectedFrom');
    const selectedTo = searchParams.get('selectedTo');

    if (!emailClientId) {
      return NextResponse.json({ error: 'Email Client ID is required' }, { status: 400 });
    }

    // Use shared service to get email metrics
    const result = await getEmailMetrics({
      emailClientId,
      userId: session.user.id,
      fromDate,
      toDate,
      selectedFrom,
      selectedTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching email metrics:', error);

    if (error instanceof Error && error.message === 'Email Client not found or not accessible') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
