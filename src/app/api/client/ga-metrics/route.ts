import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GaMetricsResponse, GaMetricsError } from '@/lib/types/ga-metrics';

interface LLMDashboardResponse {
  runID: string;
  gaPropertyId: string;
  datasets: Array<{
    table: string;
    rows: string;
  }>;
}

// Helper function to transform LLM dashboard data
function transformLLMDashboardData(llmResponse: LLMDashboardResponse | LLMDashboardResponse[]): {
  kpiDaily: any[] | null;
  kpiMonthly: any[] | null;
  channelDaily: any[] | null;
  sourceDaily: any[] | null;
} {
  let kpiDaily: any[] = [];
  let kpiMonthly: any[] = [];
  let channelDaily: any[] = [];
  let sourceDaily: any[] = [];

  try {

    const defaultMetrics = {
      sessions: 0,
      screenPageViewsPerSession: 0,
      engagementRate: 0,
      avgSessionDurationSec: 0,
      goalCompletions: 0,
      goalCompletionRate: 0
    };

    // If the response is an array, use the first object
    let normalizedResponse: LLMDashboardResponse;
    if (Array.isArray(llmResponse)) {
      if (llmResponse.length === 0) {
        throw new Error('LLM response array is empty');
      }
      normalizedResponse = llmResponse[0];
    } else {
      normalizedResponse = llmResponse;
    }

    // Validate response structure
    if (!normalizedResponse || typeof normalizedResponse !== 'object') {
      // console.error('Transform LLM Data - Invalid response format: Response is not an object');
      throw new Error('Invalid response format: Response is not an object');
    }

    if (!Array.isArray(normalizedResponse.datasets)) {
      throw new Error('Invalid response format: datasets is not an array');
    } else {
      // Process each dataset from the LLM response
      normalizedResponse.datasets.forEach(processDataset);
    }

    return {
      kpiDaily: kpiDaily.length > 0 ? kpiDaily : null,
      kpiMonthly: kpiMonthly.length > 0 ? kpiMonthly : null,
      channelDaily: channelDaily.length > 0 ? channelDaily : null,
      sourceDaily: sourceDaily.length > 0 ? sourceDaily : null
    };
  } catch (error) {
    console.error('Transform LLM Data - Error during transformation:', error);
    throw new Error('Failed to transform LLM dashboard data');
  }

  // Helper function to process a single dataset
  function processDataset(dataset: any) {
    try {
      // Dynamically find the table key
      const tableKey = Object.keys(dataset).find(
        (k) => k.replace(/\s+/g, '').toLowerCase() === 'table'
      );
      // Dynamically find the rows/row key
      const rowsKey = Object.keys(dataset).find(
        (k) => k.replace(/\s+/g, '').toLowerCase() === 'rows' || k.replace(/\s+/g, '').toLowerCase() === 'row'
      );
      if (!tableKey || !rowsKey) {
        return;
      }
      const tableName = (dataset[tableKey] || '').trim().toLowerCase();
      let rowsRaw = dataset[rowsKey];
      let rows: any[];
      try {
        rows = typeof rowsRaw === 'string' ? JSON.parse(rowsRaw) : rowsRaw;
      } catch (e) {
        console.error('Transform LLM Data - Error parsing rows:', e);
        return;
      }

      if (!Array.isArray(rows)) {
        return;
      }

      switch(tableName) {
        case 'daily_metrics':
        case 'kpi_daily':
        case 'daily':
          if (rows.length > 0) {
            kpiDaily = rows.map(day => ({
              date: day.date,
              sessions: Number(day.sessions) || 0,
              screenPageViewsPerSession: Number(day.pageviews_per_session || day.screenPageViewsPerSession) || 0,
              engagementRate: Number(day.engagement_rate || day.engagementRate) || 0,
              avgSessionDurationSec: Number(day.avg_session_duration || day.avgSessionDurationSec) || 0,
              goalCompletions: Number(day.goal_completions || day.goalCompletions) || 0,
              goalCompletionRate: Number(day.goal_completion_rate || day.goalCompletionRate) || 0
            }));
          }
          break;

        case 'monthly_metrics':
        case 'kpi_monthly':
        case 'monthly':
          if (rows.length > 0) {
            kpiMonthly = rows.map(month => ({
              month: month.month,
              sessions: Number(month.sessions) || 0,
              screenPageViewsPerSession: Number(month.pageviews_per_session || month.screenPageViewsPerSession) || 0,
              engagementRate: Number(month.engagement_rate || month.engagementRate) || 0,
              avgSessionDurationSec: Number(month.avg_session_duration || month.avgSessionDurationSec) || 0,
              goalCompletions: Number(month.goal_completions || month.goalCompletions) || 0,
              goalCompletionRate: Number(month.goal_completion_rate || month.goalCompletionRate) || 0
            }));
          }
          break;

        case 'channel_metrics':
        case 'channel_daily':
        case 'channel':
        case 'channeldaily':
          channelDaily = rows.map(row => ({
            date: row.date,
            channelGroup: row.channel || row.channelGroup || 'direct',
            sessions: Number(row.sessions) || 0,
            screenPageViewsPerSession: Number(row.pageviews_per_session || row.screenPageViewsPerSession) || 0,
            engagementRate: Number(row.engagement_rate || row.engagementRate) || 0,
            avgSessionDurationSec: Number(row.avg_session_duration || row.avgSessionDurationSec) || 0,
            goalCompletions: Number(row.goal_completions || row.goalCompletions) || 0,
            goalCompletionRate: Number(row.goal_completion_rate || row.goalCompletionRate) || 0
          }));
          break;

        case 'source_metrics':
        case 'source_daily':
        case 'source':
        case 'sourcedaily':
          sourceDaily = rows.map(row => ({
            date: row.date,
            trafficSource: row.source || row.trafficSource || 'direct',
            sessions: Number(row.sessions) || 0,
            screenPageViewsPerSession: Number(row.pageviews_per_session || row.screenPageViewsPerSession) || 0,
            engagementRate: Number(row.engagement_rate || row.engagementRate) || 0,
            avgSessionDurationSec: Number(row.avg_session_duration || row.avgSessionDurationSec) || 0,
            goalCompletions: Number(row.goal_completions || row.goalCompletions) || 0,
            goalCompletionRate: Number(row.goal_completion_rate || row.goalCompletionRate) || 0
          }));
          break;

        default:
          console.log('Transform LLM Data - Unknown table type:', tableName);
      }
    } catch (error) {
      console.error(`Transform LLM Data - Error processing dataset:`, error);
    }
  }
}

export async function GET(request: Request): Promise<NextResponse<GaMetricsResponse | GaMetricsError>> {
  try {
    
    // Get user from session or auth header
    const session = await getServerSession(authOptions);
    let userEmail = session?.user?.email;

    // If no session, try bearer token
    const authHeader = request.headers.get('authorization');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    // Get user's GA property with accounts
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        userToGaAccounts: {
          include: {
            gaAccount: {
              include: {
                gaProperties: {
                  where: {
                    deleted: false,
                  },
                },
              },
            },
          },
        },
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    
    // Parse date params (extended range)
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Parse selected date range (for display)
    const selectedFromParam = searchParams.get('selectedFrom');
    const selectedToParam = searchParams.get('selectedTo');
    
    // Get the property ID from the request
    const requestedPropertyId = searchParams.get('propertyId');
    
    // Use the extended date range for data fetching
    const dateFrom = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = toParam ? new Date(toParam) : new Date();
    
    // Store selected range for reference (or default to same as full range)
    const displayDateFrom = selectedFromParam ? new Date(selectedFromParam) : dateFrom;
    const displayDateTo = selectedToParam ? new Date(selectedToParam) : dateTo;

    let gaPropertyId: string | undefined;
    let accountGA4: string | undefined;
    let propertyGA4: string | undefined;

    // Map and filter userToGaAccounts to get non-deleted gaAccounts
    const gaAccounts = user?.userToGaAccounts
      ?.filter(uta => uta.gaAccount && !uta.gaAccount.deleted)
      .map(uta => uta.gaAccount) || [];

    if (!gaAccounts.length) {
      console.log('GA Metrics API - No GA accounts found for user');
      return NextResponse.json(
        { error: 'No GA account found', code: 'NO_GA_ACCOUNT' },
        { status: 404 }
      );
    }

    // Find the requested property if specified
    if (requestedPropertyId) {
      const requestedProperty = gaAccounts
        .flatMap((account: any) => account.gaProperties)
        .find((property: any) => property.id === requestedPropertyId);

      if (requestedProperty) {
        const parentAccount = gaAccounts.find((account: any) => 
          account.gaProperties.some((prop: any) => prop.id === requestedPropertyId)
        );
        if (parentAccount) {
          gaPropertyId = requestedProperty.id;
          accountGA4 = parentAccount.gaAccountId;
          propertyGA4 = requestedProperty.gaPropertyId;
        }
      }
    }

    // If no property was found or no property was requested, use the first property
    if (!gaPropertyId || !accountGA4 || !propertyGA4) {
      // If no properties exist, create one
      if (!gaAccounts[0]?.gaProperties?.length) {
        console.log('GA Metrics API - No GA properties found, creating default property');
        try {
          const gaAccount = gaAccounts[0];
          const newProperty = await prisma.gaProperty.create({
            data: {
              gaPropertyId: gaAccount.gaAccountId, // Use account ID as property ID for now
              gaPropertyName: `Default Property for ${gaAccount.gaAccountName}`,
              gaAccountId: gaAccount.id
            }
          });
          gaPropertyId = newProperty.id;
          accountGA4 = gaAccount.gaAccountId;
          propertyGA4 = newProperty.gaPropertyId;

          // Clear any existing metrics for this property
          await Promise.all([
            prisma.gaKpiDaily.deleteMany({
              where: { gaPropertyId: newProperty.id }
            }),
            prisma.gaKpiMonthly.deleteMany({
              where: { gaPropertyId: newProperty.id }
            }),
            prisma.gaChannelDaily.deleteMany({
              where: { gaPropertyId: newProperty.id }
            }),
            prisma.gaSourceDaily.deleteMany({
              where: { gaPropertyId: newProperty.id }
            })
          ]);
        } catch (error) {
          console.error('GA Metrics API - Error creating GA property:', error);
          return NextResponse.json(
            { error: 'Failed to create GA property', code: 'PROPERTY_CREATE_ERROR' },
            { status: 500 }
          );
        }
      } else {
        gaPropertyId = gaAccounts[0].gaProperties[0].id;
        accountGA4 = gaAccounts[0].gaAccountId;
        propertyGA4 = gaAccounts[0].gaProperties[0].gaPropertyId;
      }
    }

    // Ensure we have all required values
    if (!gaPropertyId || !accountGA4 || !propertyGA4) {
      console.error('GA Metrics API - Failed to determine property or account');
      return NextResponse.json(
        { error: 'Failed to determine property or account', code: 'PROPERTY_DETERMINATION_ERROR' },
        { status: 500 }
      );
    }

    // Check if data exists in tables
    const [kpiDailyCount, kpiMonthlyCount, channelDailyCount, sourceDailyCount] = await Promise.all([
      prisma.gaKpiDaily.count({ where: { gaPropertyId } }),
      prisma.gaKpiMonthly.count({ where: { gaPropertyId } }),
      prisma.gaChannelDaily.count({ where: { gaPropertyId } }),
      prisma.gaSourceDaily.count({ where: { gaPropertyId } })
    ]);

    // Ensure we have the selected period for display
    
    // Get current month in YYYYMM format for monthly data
    const currentMonth = parseInt(
      new Date().getFullYear().toString() + 
      (new Date().getMonth() + 1).toString().padStart(2, '0')
    );
    
    // Calculate the month from at least 2 years ago for proper comparison
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const oldestMonth = parseInt(
      twoYearsAgo.getFullYear().toString() + 
      (twoYearsAgo.getMonth() + 1).toString().padStart(2, '0')
    );

    // Set date ranges based on what we need
    let queryDateFrom: Date;
    let queryDateTo: Date = new Date(); // Always use today as the end date

    queryDateFrom = new Date(dateFrom);
    queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 1);

    console.log('queryDateFrom', queryDateFrom);
    console.log('queryDateTo', queryDateTo);
    console.log('gaPropertyId being queried:', gaPropertyId);
    console.log('oldestMonth:', oldestMonth);
    console.log('currentMonth:', currentMonth);

    // Fetch all metrics in parallel with new date ranges
    const [kpiDaily, kpiMonthly, channelDaily, sourceDaily] = await Promise.all([
      prisma.gaKpiDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.gaKpiMonthly.findMany({
        where: {
          gaPropertyId,
          OR: [
            // Try YYYYMM format first
            {
              month: {
                gte: oldestMonth,
                lte: currentMonth
              }
            },
            // Fallback: if months are stored as 1-12, get all records
            {
              month: {
                gte: 1,
                lte: 12
              }
            }
          ]
        }
      }).then(result => {
        console.log(`kpiMonthly query - gaPropertyId: ${gaPropertyId}, month range: ${oldestMonth} to ${currentMonth}, found ${result.length} records`);
        console.log('Found monthly records:', result.map(r => ({ month: r.month, sessions: r.sessions })));
        return result;
      }),
      prisma.gaChannelDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.gaSourceDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: queryDateFrom,
            lte: queryDateTo
          }
        },
        orderBy: { date: 'desc' }
      })
    ]);

    console.log('kpiMonthly', kpiMonthly);

    // Debug: Check if ANY monthly data exists for this property
    const allMonthlyData = await prisma.gaKpiMonthly.findMany({
      where: { gaPropertyId },
      select: { month: true, sessions: true }
    });
    console.log('All monthly data for this property:', allMonthlyData);

    // Return the GA metrics data from database with metadata about the date ranges
    return NextResponse.json({
      kpiDaily: kpiDaily
        ? (Array.isArray(kpiDaily) ? kpiDaily : [kpiDaily]).map((entry: any) => {
            const { date, ...rest } = entry;
            return {
              ...rest,
              date: typeof date === 'string' ? date : date?.toISOString(),
            };
          })
        : null,
      kpiMonthly: kpiMonthly
        ? (Array.isArray(kpiMonthly) ? kpiMonthly : [kpiMonthly]).map((entry: any) => {
            const { month, ...rest } = entry;
            return {
              ...rest,
              month,
            };
          })
        : null,
      channelDaily: channelDaily
        ? (Array.isArray(channelDaily) ? channelDaily : [channelDaily]).map((entry: any) => {
            const { date, ...rest } = entry;
            return {
              ...rest,
              date: typeof date === 'string' ? date : date?.toISOString(),
            };
          })
        : null,
      sourceDaily: sourceDaily
        ? (Array.isArray(sourceDaily) ? sourceDaily : [sourceDaily]).map((entry: any) => {
            const { date, ...rest } = entry;
            return {
              ...rest,
              date: typeof date === 'string' ? date : date?.toISOString(),
            };
          })
        : null,
      // Add metadata about the date ranges for UI components
      metadata: {
        displayDateRange: {
          from: displayDateFrom.toISOString(),
          to: displayDateTo.toISOString()
        },
        fullDateRange: {
          from: queryDateFrom.toISOString(),
          to: queryDateTo.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching GA metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
} 