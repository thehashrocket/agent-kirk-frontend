/**
 * @fileoverview Client Activity API Route
 * 
 * This API route provides functionality for fetching and analyzing client activity data.
 * It supports filtering by date range and activity type, and returns comprehensive metrics
 * including activity counts, success rates, and action breakdowns.
 * 
 * @route GET /api/reports/client-activity
 * @authentication Required - Uses NextAuth session
 * 
 * @queryParams
 * - startDate {ISO string} Start date for the activity range
 * - endDate {ISO string} End date for the activity range
 * - type {string} Optional activity type filter
 * 
 * @returns {Object}
 *   - metrics {Object} Aggregated metrics for the period
 *     - totalActivities {Object} Total activity count and change
 *     - successRate {Object} Success rate percentage and change
 *     - averageTime {Object} Average activity time and change
 *     - uniqueActions {Object} Count of unique action types and change
 *   - activities {Array} List of individual activity records
 *   - actionBreakdown {Array} Breakdown of activity types and their frequencies
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If date parameters are invalid
 * @throws {500} If server encounters an error
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, parseISO } from "date-fns";
import { Prisma, ClientActivity, ActivityStatus } from "@prisma/client";

/**
 * Type representing the selected fields from ClientActivity
 */
type ActivityWithoutUser = Pick<ClientActivity, 'id' | 'type' | 'description' | 'createdAt' | 'status' | 'metadata'>;

/**
 * Handles GET requests for client activity data
 * Fetches and analyzes client activities within a specified date range
 * 
 * @param {NextRequest} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with activity data and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = parseISO(searchParams.get("startDate") || "");
    const endDate = parseISO(searchParams.get("endDate") || "");
    const type = searchParams.get("type");

    // Validate date parameters
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid date parameters" }),
        { status: 400 }
      );
    }

    // Construct base query with filters
    const baseQuery = {
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(type !== "all" && type ? { type } : {}),
      },
    };

    // Fetch current and previous period data for comparison
    const [currentActivities, previousActivities] = await Promise.all([
      prisma.clientActivity.findMany({
        ...baseQuery,
        select: {
          id: true,
          type: true,
          description: true,
          createdAt: true,
          status: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.clientActivity.findMany({
        where: {
          ...baseQuery.where,
          createdAt: {
            gte: subDays(startDate, 30),
            lte: subDays(endDate, 30),
          },
        },
        select: {
          id: true,
          type: true,
          description: true,
          createdAt: true,
          status: true,
          metadata: true,
        },
      }),
    ]) as [ActivityWithoutUser[], ActivityWithoutUser[]];

    // Calculate core metrics
    const currentTotal = currentActivities.length;
    const previousTotal = previousActivities.length;
    const currentSuccess = currentActivities.filter(
      (activity) => activity.status === ActivityStatus.SUCCESS
    ).length;
    const uniqueTypes = new Set(currentActivities.map((activity) => activity.type)).size;

    // Generate activity type breakdown
    const actionCounts = currentActivities.reduce((acc: Record<string, number>, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    const actionBreakdown = Object.entries(actionCounts).map(([type, count]) => ({
      type,
      count,
      percentage: (count / currentTotal) * 100,
    }));

    // Construct response with metrics and activities
    const response = {
      metrics: {
        totalActivities: {
          label: "Total Activities",
          value: currentTotal,
          change: calculatePercentageChange(currentTotal, previousTotal),
        },
        successRate: {
          label: "Success Rate",
          value: (currentSuccess / currentTotal) * 100,
          change: 0, // TODO: Implement historical success rate tracking
        },
        averageTime: {
          label: "Average Time",
          value: 2.5, // TODO: Implement actual timing calculation
          change: 0, // TODO: Implement historical timing tracking
        },
        uniqueActions: {
          label: "Unique Actions",
          value: uniqueTypes,
          change: 0, // TODO: Implement historical unique actions tracking
        },
      },
      activities: currentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt.toISOString(),
        status: activity.status,
        metadata: activity.metadata,
      })),
      actionBreakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching client activity:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch client activity data" }),
      { status: 500 }
    );
  }
}

/**
 * Calculates the percentage change between two numbers
 * 
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number} Percentage change, returns 0 if previous value is 0
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
} 