import { PrismaClient } from '@/lib/prisma';
import { GaMetricsResponse } from '../types/ga-metrics';

// Import the generated Prisma client
import { prisma } from '../prisma';

export async function saveGaMetrics(
  gaPropertyId: string,
  metrics: GaMetricsResponse,
  userId: string
) {
  try {
    console.log('Saving GA Metrics - Starting');

    // Get current month in YYYYMM format
    const today = new Date();
    const currentMonth = parseInt(
      today.getFullYear().toString() + 
      (today.getMonth() + 1).toString().padStart(2, '0')
    );

    // Create import run record
    const importRun = await prisma.gaImportRun.create({
      data: {
        gaPropertyId,
        dateStart: new Date(today.getFullYear(), today.getMonth(), 1), // First day of current month
        dateEnd: today,
        requestedByUserId: userId,
        status: 'ok'
      }
    });
    console.log('Saving GA Metrics - Import run created:', importRun.id);

    // Save daily metrics if available
    if (metrics.kpiDaily?.length) {
      console.log('Saving GA Metrics - Storing daily KPI metrics');
      await Promise.all(
        metrics.kpiDaily.map(day =>
          prisma.gaKpiDaily.upsert({
            where: {
              gaPropertyId_date: {
                gaPropertyId,
                date: new Date(day.date)
              }
            },
            create: {
              gaPropertyId,
              ...day,
              date: new Date(day.date)
            },
            update: {
              ...day,
              date: new Date(day.date)
            }
          })
        )
      );
    }

    // Save monthly metrics if available
    if (metrics.kpiMonthly?.length) {
      console.log('Saving GA Metrics - Storing monthly KPI metrics');
      await Promise.all(
        metrics.kpiMonthly.map(month =>
          prisma.gaKpiMonthly.upsert({
            where: {
              gaPropertyId_month: {
                gaPropertyId,
                month: month.month
              }
            },
            create: {
              gaPropertyId,
              ...month
            },
            update: month
          })
        )
      );
    }

    // Save channel metrics if available
    if (metrics.channelDaily?.length) {
      console.log('Saving GA Metrics - Storing channel metrics');
      await Promise.all(
        metrics.channelDaily.map(channel =>
          prisma.gaChannelDaily.upsert({
            where: {
              gaPropertyId_date_channelGroup: {
                gaPropertyId,
                date: today,
                channelGroup: channel.channelGroup
              }
            },
            create: {
              gaPropertyId,
              date: today,
              channelGroup: channel.channelGroup,
              sessions: channel.sessions,
              screenPageViewsPerSession: 0,
              engagementRate: 0,
              avgSessionDurationSec: 0,
              goalCompletions: 0,
              goalCompletionRate: 0
            },
            update: {
              channelGroup: channel.channelGroup,
              sessions: channel.sessions,
              screenPageViewsPerSession: 0,
              engagementRate: 0,
              avgSessionDurationSec: 0,
              goalCompletions: 0,
              goalCompletionRate: 0
            }
          })
        )
      );
    }

    // Save source metrics if available
    if (metrics.sourceDaily?.length) {
      console.log('Saving GA Metrics - Storing source metrics');
      await Promise.all(
        metrics.sourceDaily.map(source =>
          prisma.gaSourceDaily.upsert({
            where: {
              gaPropertyId_date_trafficSource: {
                gaPropertyId,
                date: today,
                trafficSource: source.trafficSource
              }
            },
            create: {
              gaPropertyId,
              date: today,
              trafficSource: source.trafficSource,
              sessions: source.sessions,
              screenPageViewsPerSession: 0,
              engagementRate: 0,
              avgSessionDurationSec: 0,
              goalCompletions: 0,
              goalCompletionRate: 0
            },
            update: {
              trafficSource: source.trafficSource,
              sessions: source.sessions,
              screenPageViewsPerSession: 0,
              engagementRate: 0,
              avgSessionDurationSec: 0,
              goalCompletions: 0,
              goalCompletionRate: 0
            }
          })
        )
      );
    }

    console.log('Saving GA Metrics - Complete');
    return importRun;
  } catch (error) {
    console.error('Error saving GA metrics:', error);
    throw error;
  }
} 