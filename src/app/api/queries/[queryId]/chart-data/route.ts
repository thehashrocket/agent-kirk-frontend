/**
 * @fileoverview Chart Data API Route
 * 
 * This route handles fetching parsed query data and pie graph data for a specific query.
 * It returns both datasets in a combined response for use in chart visualizations.
 * 
 * @route GET src/app/api/queries/[queryId]/chart-data
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Fetch both types of data in parallel for better performance
    const [parsedQueryData, parsedPieGraphData] = await Promise.all([
      prisma.parsedQueryData.findMany({
        where: { queryId },
        orderBy: { date: 'asc' }
      }),
      prisma.parsedPieGraphData.findMany({
        where: { queryId }
      })
    ]);

    console.log('parsedQueryData', parsedQueryData);
    console.log('parsedPieGraphData', parsedPieGraphData);

    return NextResponse.json({
      parsedQueryData,
      parsedPieGraphData
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 