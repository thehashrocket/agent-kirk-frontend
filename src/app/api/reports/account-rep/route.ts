/**
 * @fileoverview Account Representative Report API Route
 * 
 * This route handles the generation of account representative reports.
 * It is protected and only accessible to authenticated users with the ACCOUNT_REP role.
 * The route accepts optional date range parameters and returns report data specific
 * to the authenticated account representative.
 * 
 * @route POST /api/reports/account-rep
 * @secure Requires authentication and ACCOUNT_REP role
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAccountRepReportData } from '@/lib/services/reports';
import { prisma } from '@/lib/prisma';

/**
 * Zod schema for validating report request parameters
 * @typedef {Object} ReportRequest
 * @property {string} [startDate] - Optional start date for the report range
 * @property {string} [endDate] - Optional end date for the report range
 */
const reportRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Handles POST requests for generating account representative reports
 * 
 * @async
 * @function POST
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing either the report data or error message
 * 
 * @throws {NextResponse} 401 - If user is not authenticated
 * @throws {NextResponse} 403 - If user is not an account representative
 * @throws {NextResponse} 400 - If request body fails validation
 * @throws {NextResponse} 500 - If server encounters an error during processing
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user and verify they are an account rep
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (!currentUser || currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const body = reportRequestSchema.parse(json);

    const reportData = await getAccountRepReportData(
      currentUser.id,
      body.startDate,
      body.endDate
    );

    return NextResponse.json(reportData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    console.error('Error fetching account rep report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 