/**
 * @fileoverview Reports API Route
 * This module provides the API endpoint for fetching report data within a specified date range.
 * The route accepts optional startDate and endDate query parameters and returns the filtered report data.
 * 
 * @route GET /api/reports
 */

import { NextResponse } from "next/server";
import { getReportData } from "@/lib/services/reports";

/**
 * Handles GET requests for report data
 * 
 * @param {Request} request - The incoming HTTP request object
 * @returns {Promise<NextResponse>} JSON response containing either:
 *   - Success: Report data matching the date range
 *   - Error: Error message with 500 status code
 * 
 * @example
 * // Request:
 * GET /api/reports?startDate=2024-01-01&endDate=2024-03-31
 * 
 * @throws {Error} When report data fetching fails
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const data = await getReportData(startDate || undefined, endDate || undefined);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching report data:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
} 