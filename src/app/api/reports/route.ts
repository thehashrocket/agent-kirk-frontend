import { NextResponse } from "next/server";
import { getReportData } from "@/lib/services/reports";

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