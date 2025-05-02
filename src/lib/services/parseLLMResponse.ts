import { GaMetricsResponse } from '../types/ga-metrics';

interface LLMDataset {
  table: string;
  rows: string | any[];
}

interface LLMResponse {
  runID: string;
  gaPropertyId: string;
  datasets: LLMDataset[];
}

interface DailyMetrics {
  date: string;
  sessions: number;
  screenPageViewsPerSession: number;
  engagementRate: number;
  avgSessionDurationSec: number;
  goalCompletions: number;
  goalCompletionRate: number;
}

export function parseLLMResponse(response: any): GaMetricsResponse {
  try {
    console.log('Parsing LLM Response - Starting');
    
    // Ensure response has required structure
    if (!response || !Array.isArray(response)) {
      throw new Error('Invalid response format: Response must be an array');
    }

    // Find the daily metrics dataset
    const dailyDataset = response[0]?.datasets?.find((dataset: LLMDataset) => 
      dataset.table.toLowerCase().includes('daily')
    );

    if (!dailyDataset) {
      throw new Error('No daily metrics dataset found in response');
    }

    // Parse rows if they're in string format
    const rows: DailyMetrics[] = typeof dailyDataset.rows === 'string' 
      ? JSON.parse(dailyDataset.rows)
      : dailyDataset.rows;

    if (!Array.isArray(rows)) {
      throw new Error('Invalid rows format: Rows must be an array');
    }

    // Sort rows by date to get the latest data
    const sortedRows = [...rows].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get the latest day's metrics for kpiDaily
    const latestDay = sortedRows[0];
    const kpiDaily = latestDay ? {
      date: latestDay.date,
      sessions: Number(latestDay.sessions) || 0,
      screenPageViewsPerSession: Number(latestDay.screenPageViewsPerSession) || 0,
      engagementRate: Number(latestDay.engagementRate) || 0,
      avgSessionDurationSec: Number(latestDay.avgSessionDurationSec) || 0,
      goalCompletions: Number(latestDay.goalCompletions) || 0,
      goalCompletionRate: Number(latestDay.goalCompletionRate) || 0
    } : null;

    // Calculate monthly metrics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthRows = rows.filter(row => {
      const date = new Date(row.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const kpiMonthly = currentMonthRows.length > 0 ? {
      month: parseInt(`${currentYear}${(currentMonth + 1).toString().padStart(2, '0')}`),
      sessions: currentMonthRows.reduce((sum, row) => sum + (Number(row.sessions) || 0), 0),
      screenPageViewsPerSession: currentMonthRows.reduce((sum, row) => sum + (Number(row.screenPageViewsPerSession) || 0), 0) / currentMonthRows.length,
      engagementRate: currentMonthRows.reduce((sum, row) => sum + (Number(row.engagementRate) || 0), 0) / currentMonthRows.length,
      avgSessionDurationSec: currentMonthRows.reduce((sum, row) => sum + (Number(row.avgSessionDurationSec) || 0), 0) / currentMonthRows.length,
      goalCompletions: currentMonthRows.reduce((sum, row) => sum + (Number(row.goalCompletions) || 0), 0),
      goalCompletionRate: currentMonthRows.reduce((sum, row) => sum + (Number(row.goalCompletionRate) || 0), 0) / currentMonthRows.length
    } : null;

    // For now, return null for channelDaily and sourceDaily as they're not in the current response
    // These would need to be implemented when that data becomes available
    const channelDaily = null;
    const sourceDaily = null;

    console.log('Parsing LLM Response - Complete');
    return {
      kpiDaily: kpiDaily ? [kpiDaily] : null,
      kpiMonthly: kpiMonthly ? [kpiMonthly] : null,
      channelDaily,
      sourceDaily
    };
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    throw error;
  }
} 