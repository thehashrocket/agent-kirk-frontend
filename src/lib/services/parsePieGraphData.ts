import { ParsedPieGraphData } from "@prisma/client";

export type ParsedPieDataInput = Omit<ParsedPieGraphData, "id" | "queryId" | "createdAt">;

export function parsePieGraphData(data: any[]): ParsedPieDataInput[] {
  return data.map(entry => {
    const [channel, source = ""] = entry.dimensions;

    return {
      channel,
      source,
      sessions: Math.round(entry.metrics[0]),
      conversionRate: parseFloat(entry.metrics[1]),
      conversions: Math.round(entry.metrics[2]),
      bounces: Math.round(entry.metrics[3]),

      prevSessionsDiff: entry.prevDiff?.[0] ?? 0,
      prevConversionRateDiff: entry.prevDiff?.[1] ?? 0,
      prevConversionsDiff: entry.prevDiff?.[2] ?? 0,
      prevBouncesDiff: entry.prevDiff?.[3] ?? 0,

      yearSessionsDiff: entry.yearDiff?.[0] ?? 0,
      yearConversionRateDiff: entry.yearDiff?.[1] ?? 0,
      yearConversionsDiff: entry.yearDiff?.[2] ?? 0,
      yearBouncesDiff: entry.yearDiff?.[3] ?? 0,
    };
  });
}
