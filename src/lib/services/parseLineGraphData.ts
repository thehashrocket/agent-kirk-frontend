// File Path: src/lib/services/parseLineGraphData.ts

export type ParsedLineGraphRow = {
  date: string; // YYYY-MM-DD
  source: string;
  engagedSessions: number;
  bounceRate: number;
  newUsers: number;
  conversions: number;
};

export type ParsedLineGraphSummary = {
  date: string;
  totalEngagedSessions: number;
  averageBounceRate: number;
  totalNewUsers: number;
  totalConversions: number;
};

export interface ParsedLineGraphData {
  flat: ParsedLineGraphRow[];
  grouped: Record<string, {
    date: string;
    sources: Record<string, ParsedLineGraphRow>;
    summary: ParsedLineGraphSummary;
  }>;
}

export function parseLineGraphData(data: any): ParsedLineGraphData {
  const flat: ParsedLineGraphRow[] = [];
  const grouped: ParsedLineGraphData['grouped'] = {};

  const headers = data?.dimensionHeaders?.map((d: any) => d.name) ?? [];
  const metricHeaders = data?.metricHeaders?.map((m: any) => m.name) ?? [];
  const rows = data?.rows ?? [];

  for (const row of rows) {

    const dateRaw = row.dimensionValues[headers.indexOf("date")]?.value ?? "";
    const source = row.dimensionValues[headers.indexOf("sessionSourceMedium")]?.value ?? "";
    const metrics = row.metricValues.map((m: any) => parseFloat(m.value ?? "0"));

    const date = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
    const [engagedSessions, bounceRate, newUsers, conversions] = metrics;

    const entry: ParsedLineGraphRow = {
      date,
      source,
      engagedSessions,
      bounceRate,
      newUsers,
      conversions,
    };

    flat.push(entry);

    if (!grouped[date]) {
      grouped[date] = {
        date,
        sources: {},
        summary: {
          date,
          totalEngagedSessions: 0,
          averageBounceRate: 0,
          totalNewUsers: 0,
          totalConversions: 0,
        },
      };
    }

    grouped[date].sources[source] = entry;
    grouped[date].summary.totalEngagedSessions += engagedSessions;
    grouped[date].summary.averageBounceRate += bounceRate;
    grouped[date].summary.totalNewUsers += newUsers;
    grouped[date].summary.totalConversions += conversions;
  }

  for (const group of Object.values(grouped)) {
    const count = Object.keys(group.sources).length || 1;
    group.summary.averageBounceRate /= count;
  }

  return { flat, grouped };
}
