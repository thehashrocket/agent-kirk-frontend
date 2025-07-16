import { ParsedPieGraphData } from "@/prisma/generated/client";

export type ParsedPieDataInput = Omit<ParsedPieGraphData, "id" | "queryId" | "createdAt" | "updatedAt">;

interface PieGraphDataEntry {
  dimensions: [string, string?];
  metrics: number[];
  prevDiff?: number[];
  yearDiff?: number[];
}

export function parsePieGraphData(data: PieGraphDataEntry[]): ParsedPieDataInput[] {
  if (!Array.isArray(data)) {
    throw new Error('Input must be an array of pie graph data entries');
  }

  return data.map(entry => {
    try {
      const [channel = '', source = ''] = entry.dimensions;
      const metrics = entry.metrics || [];
      const prevDiff = entry.prevDiff || [];
      const yearDiff = entry.yearDiff || [];

      return {
        channel,
        source,
        sessions: Math.round(metrics[0] || 0),
        conversionRate: parseFloat((metrics[1] || 0).toFixed(4)),
        conversions: Math.round(metrics[2] || 0),
        bounces: Math.round(metrics[3] || 0),

        prevSessionsDiff: prevDiff[0] ?? 0,
        prevConversionRateDiff: prevDiff[1] ?? 0,
        prevConversionsDiff: prevDiff[2] ?? 0,
        prevBouncesDiff: prevDiff[3] ?? 0,

        yearSessionsDiff: yearDiff[0] ?? 0,
        yearConversionRateDiff: yearDiff[1] ?? 0,
        yearConversionsDiff: yearDiff[2] ?? 0,
        yearBouncesDiff: yearDiff[3] ?? 0,
      };
    } catch (error) {
      console.error('Error parsing pie graph data entry:', error, entry);
      // Return a default object with zeros
      return {
        channel: '',
        source: '',
        sessions: 0,
        conversionRate: 0,
        conversions: 0,
        bounces: 0,
        prevSessionsDiff: 0,
        prevConversionRateDiff: 0,
        prevConversionsDiff: 0,
        prevBouncesDiff: 0,
        yearSessionsDiff: 0,
        yearConversionRateDiff: 0,
        yearConversionsDiff: 0,
        yearBouncesDiff: 0,
      };
    }
  });
}
