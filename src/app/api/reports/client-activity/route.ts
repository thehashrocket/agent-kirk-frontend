/**
 * @file src/app/api/reports/client-activity/route.ts
 * API route for fetching client activity data with filtering capabilities.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, parseISO } from "date-fns";
import { Prisma } from "@prisma/client";

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  status: 'success' | 'error' | 'pending';
  metadata: Record<string, any> | null;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = parseISO(searchParams.get("startDate") || "");
    const endDate = parseISO(searchParams.get("endDate") || "");
    const type = searchParams.get("type");

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid date parameters" }),
        { status: 400 }
      );
    }

    // Build base query
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

    // Get current period metrics
    const [currentActivities, previousActivities] = await Promise.all([
      // Current period
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
      // Previous period (for comparison)
      prisma.clientActivity.findMany({
        where: {
          ...baseQuery.where,
          createdAt: {
            gte: subDays(startDate, 30),
            lte: subDays(endDate, 30),
          },
        },
      }),
    ]) as [Activity[], Activity[]];

    // Calculate metrics
    const currentTotal = currentActivities.length;
    const previousTotal = previousActivities.length;
    const currentSuccess = currentActivities.filter(
      (activity: Activity) => activity.status === "success"
    ).length;
    const uniqueTypes = new Set(currentActivities.map((activity: Activity) => activity.type)).size;

    // Calculate action breakdown
    const actionCounts = currentActivities.reduce((acc: Record<string, number>, activity: Activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    const actionBreakdown = Object.entries(actionCounts).map(([type, count]) => ({
      type,
      count,
      percentage: (count / currentTotal) * 100,
    }));

    // Format response
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
          change: 0, // Calculate this if you track historical success rates
        },
        averageTime: {
          label: "Average Time",
          value: 2.5, // This should be calculated based on actual timing data
          change: 0, // Calculate this if you track historical timing
        },
        uniqueActions: {
          label: "Unique Actions",
          value: uniqueTypes,
          change: 0, // Calculate this if you track historical unique actions
        },
      },
      activities: currentActivities.map((activity: Activity) => ({
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

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
} 