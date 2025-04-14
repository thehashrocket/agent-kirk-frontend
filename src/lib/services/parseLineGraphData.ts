import { ParsedQueryData } from "@prisma/client";

export type ParsedAnalytics = Omit<ParsedQueryData, 'id' | 'queryId' | 'createdAt'>;

export function parseLineGraphData(raw: any): ParsedAnalytics[] {
  const result: ParsedAnalytics[] = [];

  for (const block of raw) {
    const rows = block?.body?.rows ?? [];
    for (const row of rows) {
      const [dateRaw, channel, source] = row.dimensionValues.map((d: any) => d.value);
      const [sessionsRaw, conversionRateRaw, conversionsRaw, bouncesRaw] = row.metricValues.map((m: any) => m.value);

      result.push({
        date: new Date(`${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`),
        channel,
        source,
        sessions: parseInt(sessionsRaw),
        conversionRate: parseFloat(conversionRateRaw),
        conversions: parseInt(conversionsRaw),
        bounces: parseInt(bouncesRaw),
      });
    }
  }

  return result;
}
