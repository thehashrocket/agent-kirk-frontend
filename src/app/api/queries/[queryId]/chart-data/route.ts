/**
 * @fileoverview Chart Data API Route
 * 
 * This route handles fetching parsed query data and pie graph data for a specific query.
 * It returns both datasets in a combined response for use in chart visualizations.
 * 
 * File Path: src/app/api/queries/[queryId]/chart-data/route.ts
 * 
 * @route GET src/app/api/queries/[queryId]/chart-data
 * @route POST src/app/api/queries/[queryId]/chart-data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseForStorage } from '@/lib/services/parseForStorage';

/**
 * GET handler for retrieving chart data for a specific query
 * 
 * @param {Request} request - The incoming HTTP request
 * @param {Object} params - Route parameters
 * @param {string} params.queryId - The ID of the query to fetch data for
 * 
 * @returns {Promise<NextResponse>} JSON response containing parsed data or error
 * 
 * @throws {400} If queryId is missing or invalid
 * @throws {500} If there's an internal server error
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await context.params;

    if (!queryId) {
      return NextResponse.json(
        { error: 'Query ID is required' },
        { status: 400 }
      );
    }

    // Fetch all types of data in parallel for better performance
    const [queryData, summaryData, pieGraphData] = await Promise.all([
      prisma.parsedQueryData.findMany({
        where: { queryId },
        select: {
          date: true,
          engagedSessions: true,
          newUsers: true,
          bounceRate: true,
          conversions: true,
          source: true,
          channel: true
        },
        orderBy: { date: 'asc' }
      }),
      prisma.parsedQuerySummary.findMany({
        where: { queryId },
        select: {
          date: true,
          totalEngagedSessions: true,
          averageBounceRate: true,
          totalNewUsers: true,
          totalConversions: true
        },
        orderBy: { date: 'asc' }
      }),
      prisma.parsedPieGraphData.findMany({
        where: { queryId },
        select: {
          channel: true,
          source: true,
          sessions: true,
          conversions: true,
          bounces: true,
          conversionRate: true
        }
      })
    ]);

    return NextResponse.json({
      parsedQueryData: queryData,
      parsedPieGraphData: pieGraphData,
      parsedQuerySummary: summaryData
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

export async function POST(
  req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  try {
    const { queryId } = await params;
    const { lineGraphData } = await req.json();

    if (!queryId || !lineGraphData) {
      return NextResponse.json(
        { error: 'Missing queryId or lineGraphData' },
        { status: 400 }
      );
    }

    const { flat, grouped } = parseForStorage(lineGraphData, queryId);

    await prisma.$transaction([
      prisma.parsedQueryData.deleteMany({ where: { queryId } }),
      prisma.parsedQuerySummary.deleteMany({ where: { queryId } }),
      prisma.parsedQueryData.createMany({ data: flat }),
      prisma.parsedQuerySummary.createMany({ data: grouped }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to parse and store line graph data' },
      { status: 500 }
    );
  }
}