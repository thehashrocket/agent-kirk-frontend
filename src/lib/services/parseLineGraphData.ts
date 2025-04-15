import { ParsedQueryData } from "@prisma/client";

export type ParsedAnalytics = Omit<ParsedQueryData, 'id' | 'queryId' | 'createdAt'>;

interface DimensionValue {
  value: string;
}

interface MetricValue {
  value: string;
}

interface DataRow {
  dimensionValues: DimensionValue[];
  metricValues: MetricValue[];
}

interface DataBlock {
  body?: {
    rows: DataRow[];
  };
}

export function parseLineGraphData(raw: DataBlock[]): ParsedAnalytics[] {
  if (!Array.isArray(raw)) {
    throw new Error('Input must be an array of data blocks');
  }

  const result: ParsedAnalytics[] = [];

  for (const block of raw) {
    const rows = block?.body?.rows ?? [];
    for (const row of rows) {
      try {
        const [dateRaw, channel, source] = row.dimensionValues.map((d) => d.value);
        const [sessionsRaw, conversionRateRaw, conversionsRaw, bouncesRaw] = row.metricValues.map((m) => m.value);

        if (!dateRaw || dateRaw.length !== 8) {
          console.warn('Invalid date format:', dateRaw);
          continue;
        }

        result.push({
          date: new Date(`${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`),
          channel: channel || '',
          source: source || '',
          sessions: parseInt(sessionsRaw) || 0,
          conversionRate: parseFloat(conversionRateRaw) || 0,
          conversions: parseInt(conversionsRaw) || 0,
          bounces: parseInt(bouncesRaw) || 0,
        });
      } catch (error) {
        console.error('Error parsing row:', error, row);
        continue;
      }
    }
  }

  return result;
}
