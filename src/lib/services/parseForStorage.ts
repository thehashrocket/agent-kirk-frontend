import { parseLineGraphData, ParsedLineGraphRow, ParsedLineGraphData } from "./parseLineGraphData";

type GroupedData = {
  date: string;
  sources: Record<string, ParsedLineGraphRow>;
  summary: {
    date: string;
    totalEngagedSessions: number;
    averageBounceRate: number;
    totalNewUsers: number;
    totalConversions: number;
  };
};

export function parseForStorage(data: any, queryId: string) {
  // Handle array of reports
  const allParsedData = data.map((report: any) => parseLineGraphData(report.body));


  // Combine all flat data
  const combinedFlat = allParsedData.reduce((acc: ParsedLineGraphRow[], curr: ParsedLineGraphData) => {
    return [...acc, ...curr.flat];
  }, []);

  // Combine grouped data
  const combinedGrouped = allParsedData.reduce((acc: ParsedLineGraphData['grouped'], curr: ParsedLineGraphData) => {
    Object.entries(curr.grouped).forEach(([date, groupData]: [string, any]) => {
      if (!acc[date]) {
        acc[date] = groupData;
      } else {
        // Merge the summaries
        acc[date].summary.totalEngagedSessions += groupData.summary.totalEngagedSessions;
        acc[date].summary.totalNewUsers += groupData.summary.totalNewUsers;
        acc[date].summary.totalConversions += groupData.summary.totalConversions;

        // For bounce rate, we need to recalculate the average
        const existingSourceCount = Object.keys(acc[date].sources).length;
        const newSourceCount = Object.keys(groupData.sources).length;
        const totalSources = existingSourceCount + newSourceCount;

        acc[date].summary.averageBounceRate = (
          (acc[date].summary.averageBounceRate * existingSourceCount) +
          (groupData.summary.averageBounceRate * newSourceCount)
        ) / totalSources;

        // Merge the sources
        acc[date].sources = { ...acc[date].sources, ...groupData.sources };
      }
    });
    return acc;
  }, {});

  const flat = combinedFlat.map((entry: ParsedLineGraphRow) => {


    // Split source into source and channel
    let source = '';
    let channel = '';

    if (entry.source && entry.source.includes('/')) {
      [source, channel] = entry.source.split('/').map(s => s.trim());
    } else {
      source = entry.source || '';
    }

    // Create date without time component
    const dateObj = new Date(entry.date);
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    return {
      queryId,
      date: dateOnly,
      source: source,
      channel: channel,
      sessions: 0, // legacy support if needed
      conversionRate: 0,
      conversions: entry.conversions,
      bounces: 0,
      engagedSessions: entry.engagedSessions,
      bounceRate: entry.bounceRate,
      newUsers: entry.newUsers,
    };
  });

  const grouped = Object.values(combinedGrouped as Record<string, GroupedData>).map((g: GroupedData) => {
    // Create date without time component for grouped data as well
    const dateObj = new Date(g.date);
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    return {
      queryId,
      date: dateOnly,
      totalEngagedSessions: g.summary.totalEngagedSessions,
      averageBounceRate: g.summary.averageBounceRate,
      totalNewUsers: g.summary.totalNewUsers,
      totalConversions: g.summary.totalConversions,
    };
  });

  return { flat, grouped };
}
