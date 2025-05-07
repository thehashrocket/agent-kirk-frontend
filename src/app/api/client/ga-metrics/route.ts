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
    console.log('Transform LLM Data - Starting transformation');
    // console.log('Transform LLM Data - Raw response:', JSON.stringify(llmResponse, null, 2));

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
      // console.error('Transform LLM Data - Invalid response format: datasets is not an array');
      // console.log('Transform LLM Data - Available keys:', Object.keys(normalizedResponse));
      throw new Error('Invalid response format: datasets is not an array');
    } else {
      // Process each dataset from the LLM response
      normalizedResponse.datasets.forEach(processDataset);
    }

    console.log('Transform LLM Data - Transformation complete');
    console.log('Transform LLM Data - Results:', {
      hasKpiDaily: !!kpiDaily,
      hasKpiMonthly: !!kpiMonthly,
      channelDailyCount: channelDaily.length,
      sourceDailyCount: sourceDaily.length
    });

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
        console.log('Transform LLM Data - Could not find table or rows key in dataset:', Object.keys(dataset));
        return;
      }
      const tableName = (dataset[tableKey] || '').trim().toLowerCase();
      let rowsRaw = dataset[rowsKey];
      console.log('Transform LLM Data - Processing dataset:', tableName, '| rowsKey:', rowsKey);

      let rows: any[];
      try {
        rows = typeof rowsRaw === 'string' ? JSON.parse(rowsRaw) : rowsRaw;
        console.log('Transform LLM Data - Parsed rows count:', Array.isArray(rows) ? rows.length : 'not an array');
      } catch (e) {
        console.error('Transform LLM Data - Error parsing rows:', e);
        console.log('Transform LLM Data - Raw rows:', rowsRaw);
        return;
      }

      if (!Array.isArray(rows)) {
        console.error('Transform LLM Data - Rows is not an array after parsing');
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
          // console.log('Transform LLM Data - Processing channel metrics, count:', rows.length);
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
          // console.log('Transform LLM Data - Processing source metrics, count:', rows.length);
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
    console.log('GA Metrics API - Starting request');
    
    // Get the URL query parameters
    const { searchParams } = new URL(request.url);
    
    // Parse date params (extended range)
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Parse selected date range (for display)
    const selectedFromParam = searchParams.get('selectedFrom');
    const selectedToParam = searchParams.get('selectedTo');
    
    // Use the extended date range for data fetching
    const dateFrom = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = toParam ? new Date(toParam) : new Date();
    
    // Store selected range for reference (or default to same as full range)
    const displayDateFrom = selectedFromParam ? new Date(selectedFromParam) : dateFrom;
    const displayDateTo = selectedToParam ? new Date(selectedToParam) : dateTo;
    
    console.log('GA Metrics API - Date parameters:', {
      fullRangeFrom: dateFrom.toISOString(),
      fullRangeTo: dateTo.toISOString(),
      displayRangeFrom: displayDateFrom.toISOString(),
      displayRangeTo: displayDateTo.toISOString()
    });

    // Get user from session or auth header
    const session = await getServerSession(authOptions);
    let userEmail = session?.user?.email;

    // If no session, try bearer token
    const authHeader = request.headers.get('authorization');
    console.log('GA Metrics API - Auth Header:', authHeader);

    if (!userEmail) {
      console.log('GA Metrics API - No user email found from session or token');
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    console.log('GA Metrics API - Looking up user:', userEmail);
    // Get user's GA property with accounts
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        gaAccounts: {
          include: {
            gaProperties: true
          }
        }
      }
    });

    console.log('GA Metrics API - Found user:', user ? 'yes' : 'no');
    console.log('GA Metrics API - User data:', JSON.stringify({
      id: user?.id,
      email: user?.email,
      gaAccountsCount: user?.gaAccounts?.length || 0,
      hasProperties: Boolean(user?.gaAccounts?.[0]?.gaProperties?.length)
    }, null, 2));

    let gaPropertyId: string;
    let accountGA4: string;
    let propertyGA4: string;

    // Check if user has GA accounts
    if (!user?.gaAccounts?.length) {
      console.log('GA Metrics API - No GA accounts found for user');
      return NextResponse.json(
        { error: 'No GA account found', code: 'NO_GA_ACCOUNT' },
        { status: 404 }
      );
    }

    // If no properties exist, create one
    if (!user.gaAccounts[0].gaProperties?.length) {
      console.log('GA Metrics API - No GA properties found, creating default property');
      try {
        const gaAccount = user.gaAccounts[0];
        const newProperty = await prisma.gaProperty.create({
          data: {
            gaPropertyId: gaAccount.gaAccountId, // Use account ID as property ID for now
            gaPropertyName: `Default Property for ${gaAccount.gaAccountName}`,
            gaAccountId: gaAccount.id
          }
        });
        console.log('GA Metrics API - Created new GA property:', newProperty.id);
        gaPropertyId = newProperty.id;
        accountGA4 = gaAccount.gaAccountId;
        propertyGA4 = newProperty.gaPropertyId;

        // Clear any existing metrics for this property
        console.log('GA Metrics API - Clearing any existing metrics for new property');
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
        console.log('GA Metrics API - Cleared existing metrics');
      } catch (error) {
        console.error('GA Metrics API - Error creating GA property:', error);
        return NextResponse.json(
          { error: 'Failed to create GA property', code: 'PROPERTY_CREATE_ERROR' },
          { status: 500 }
        );
      }
    } else {
      gaPropertyId = user.gaAccounts[0].gaProperties[0].id;
      accountGA4 = user.gaAccounts[0].gaAccountId;
      propertyGA4 = user.gaAccounts[0].gaProperties[0].gaPropertyId;
    }

    // Instead of only checking if data exists, count the records to determine if we need full history
    console.log('GA Metrics API - Checking if data exists in tables');
    const [kpiDailyCount, kpiMonthlyCount, channelDailyCount, sourceDailyCount] = await Promise.all([
      prisma.gaKpiDaily.count({ where: { gaPropertyId } }),
      prisma.gaKpiMonthly.count({ where: { gaPropertyId } }),
      prisma.gaChannelDaily.count({ where: { gaPropertyId } }),
      prisma.gaSourceDaily.count({ where: { gaPropertyId } })
    ]);
    
    // Determine if we need to fetch historical data (5 years) or just the selected range + previous year
    const needsHistoricalData = kpiDailyCount === 0 || kpiMonthlyCount === 0 || 
                               channelDailyCount === 0 || sourceDailyCount === 0;
    
    // console.log('GA Metrics API - Data check results:', {
    //   kpiDailyCount,
    //   kpiMonthlyCount,
    //   channelDailyCount,
    //   sourceDailyCount,
    //   needsHistoricalData
    // });
    
    // Set date ranges based on what we need
    let queryDateFrom: Date;
    let queryDateTo: Date = new Date(); // Always use today as the end date
    
    if (needsHistoricalData) {
      // If we need historical data, fetch 5 years worth
      console.log('GA Metrics API - No data found, will fetch 5 years of historical data');
      queryDateFrom = new Date();
      queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 5);
    } else {
      // Otherwise, get the selected range + previous year for YoY comparison
      console.log('GA Metrics API - Data exists, fetching selected range + previous year');
      queryDateFrom = new Date(dateFrom);
      queryDateFrom.setFullYear(queryDateFrom.getFullYear() - 1); // Go back one year from start date
    }

    // IF we don't need historical data, we can pull the most recent month of data from the LLM_DASHBOARD_URL
    if (!needsHistoricalData) {
      console.log('GA Metrics API - No historical data needed, fetching most recent month');
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const queryDateFrom = new Date(currentYear, currentMonth - 1, 1);
      const queryDateTo = new Date(currentYear, currentMonth, 0);

      console.log('GA Metrics API - Fetching most recent month from LLM dashboard:', {
        queryDateFrom: queryDateFrom.toISOString(),
        queryDateTo: queryDateTo.toISOString()
      });

      // Fetch the most recent month of data from the LLM_DASHBOARD_URL
      const payload = {
        accountGA4,
        propertyGA4,
        dateStart: queryDateFrom.toISOString().split('T')[0],
        dateEnd: queryDateTo.toISOString().split('T')[0],
        runID: 'recent-month'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      if (!process.env.LLM_DASHBOARD_URL) {
        throw new Error('LLM_DASHBOARD_URL is not configured');
      }
      
      const llmResponse = await fetch(process.env.LLM_DASHBOARD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!llmResponse.ok) {
        console.error('GA Metrics API - LLM dashboard request failed:', {
          status: llmResponse.status,
          statusText: llmResponse.statusText,
          error: await llmResponse.text()
        });
        throw new Error('Failed to fetch from LLM dashboard');
      }

      const llmData: LLMDashboardResponse = await llmResponse.json();
      console.log('GA Metrics API - Successfully fetched LLM dashboard data');

      try {
        const transformedData = transformLLMDashboardData(llmData);
        
        // Create import run
        console.log('GA Metrics API - Creating import run record');
        const importRun = await prisma.gaImportRun.create({
          data: {
            gaPropertyId,
            dateStart: queryDateFrom,
            dateEnd: queryDateTo,
            requestedByUserId: user.id,
            status: 'ok'
          }
        });
        console.log('GA Metrics API - Import run created:', importRun.id);

        // Store the transformed data in the database
        console.log('GA Metrics API - Storing transformed data in database');

        if (transformedData.kpiDaily?.length) {
          console.log('GA Metrics API - Storing daily KPI metrics');
          await Promise.all(
            transformedData.kpiDaily.map(day =>
              prisma.gaKpiDaily.upsert({
                where: {
                  gaPropertyId_date: {
                    gaPropertyId,
                    date: new Date(day.date)
                  }
                },
                create: {
                  gaPropertyId,
                  date: new Date(day.date),
                  ...(() => { const { date, ...rest } = day; return rest; })()
                },
                update: {
                  ...(() => { const { date, ...rest } = day; return rest; })(),
                  date: new Date(day.date)
                }
              })
            )
          );
        }

        if (transformedData.kpiMonthly?.length) {
          console.log('GA Metrics API - Storing monthly KPI metrics');
          await Promise.all(
            transformedData.kpiMonthly.map(month =>
              prisma.gaKpiMonthly.upsert({
                where: {
                  gaPropertyId_month: {
                    gaPropertyId,
                    month: month.month
                  }
                },
                create: {
                  gaPropertyId,
                  month: month.month,
                  ...month
                },
                update: month
              })
            )
          );
        }

        if (transformedData.channelDaily?.length) {
          console.log('GA Metrics API - Storing channel metrics');
          const invalidChannelRecords: any[] = [];
          let channelLogCount = 0;
          await Promise.all(
            transformedData.channelDaily.map(channel => {
              if (channelLogCount < 5) {
                console.log('channelDaily row keys:', Object.keys(channel), 'value:', channel);
                channelLogCount++;
              }
              let safeDate;
              if (typeof channel.date !== 'string' || !channel.date.trim()) {
                invalidChannelRecords.push({ channel, reason: 'Missing or invalid date field' });
                return null;
              }
              if (typeof channel.date === 'string' && channel.date.length === 10) {
                safeDate = new Date(channel.date + 'T00:00:00.000Z');
              } else {
                safeDate = new Date(channel.date);
              }
              if (isNaN(safeDate.getTime())) {
                invalidChannelRecords.push({ channel, reason: `Invalid date: ${channel.date}` });
                return null;
              }
              return prisma.gaChannelDaily.upsert({
                where: {
                  gaPropertyId_date_channelGroup: {
                    gaPropertyId,
                    date: safeDate,
                    channelGroup: channel.channelGroup
                  }
                },
                create: {
                  gaPropertyId,
                  date: safeDate,
                  channelGroup: channel.channelGroup,
                  ...(() => { const { date, channelGroup, ...rest } = channel; return rest; })()
                },
                update: {
                  ...(() => { const { date, channelGroup, ...rest } = channel; return rest; })(),
                  date: safeDate,
                  channelGroup: channel.channelGroup
                }
              });
            }).filter(Boolean)
          );
          if (invalidChannelRecords.length > 0) {
            console.warn(`GA Metrics API - Skipped ${invalidChannelRecords.length} invalid channelDaily records:`);
            invalidChannelRecords.forEach((rec, idx) => {
              // console.warn(`  [${idx + 1}] Reason: ${rec.reason}, Value:`, rec.channel);
            });
          }
        }

        if (transformedData.sourceDaily?.length) {
          console.log('GA Metrics API - Storing source metrics');
          const invalidSourceRecords: any[] = [];
          let sourceLogCount = 0;
          await Promise.all(
            transformedData.sourceDaily.map(source => { 
              if (sourceLogCount < 5) {
                console.log('sourceDaily row keys:', Object.keys(source), 'value:', source);
                sourceLogCount++;
              }
              let safeDate;
              if (typeof source.date !== 'string' || !source.date.trim()) {
                invalidSourceRecords.push({ source, reason: 'Missing or invalid date field' });
                return null;
              }
              if (typeof source.date === 'string' && source.date.length === 10) {
                safeDate = new Date(source.date + 'T00:00:00.000Z');
              } else {
                safeDate = new Date(source.date);
              }
              if (isNaN(safeDate.getTime())) {
                invalidSourceRecords.push({ source, reason: `Invalid date: ${source.date}` });
                return null;
              }
              return prisma.gaSourceDaily.upsert({
                where: {
                  gaPropertyId_date_trafficSource: {
                    gaPropertyId,
                    date: safeDate,
                    trafficSource: source.trafficSource
                  }
                },
                create: {
                  gaPropertyId,
                  date: safeDate,
                  trafficSource: source.trafficSource,
                  ...(() => { const { date, trafficSource, ...rest } = source; return rest; })()
                },
                update: {
                  ...(() => { const { date, trafficSource, ...rest } = source; return rest; })(),
                  date: safeDate,
                  trafficSource: source.trafficSource
                }
              });
            }).filter(Boolean)
          );
          if (invalidSourceRecords.length > 0) {
            console.warn(`GA Metrics API - Skipped ${invalidSourceRecords.length} invalid sourceDaily records:`);
            invalidSourceRecords.forEach((rec, idx) => {
              // console.warn(`  [${idx + 1}] Reason: ${rec.reason}, Value:`, rec.source);
            });
          }
        }

        console.log('GA Metrics API - All metrics stored successfully');
      } catch (error) {
        console.error('GA Metrics API - Error storing metrics:', error);
      }
    }

    // Ensure we have the selected period for display
    console.log('GA Metrics API - Using display date range:', {
      displayDateFrom: displayDateFrom.toISOString(),
      displayDateTo: displayDateTo.toISOString()
    });
    
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
    
    // If we need historical data but don't have it yet, ensure we go back at least 2 years
    // This guarantees proper year-over-year comparisons
    if (needsHistoricalData) {
      // Ensure we go back at least 5 years for historical data
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      queryDateFrom = fiveYearsAgo;
    } else {
      // Ensure we have at least 2 years of data for comparison
      queryDateFrom = new Date(Math.min(dateFrom.getTime(), twoYearsAgo.getTime()));
    }
    
    // Fetch metrics using our determined date ranges
    console.log('GA Metrics API - Fetching metrics with date range:', {
      queryDateFrom: queryDateFrom.toISOString(),
      queryDateTo: queryDateTo.toISOString(),
      displayDateFrom: displayDateFrom.toISOString(),
      displayDateTo: displayDateTo.toISOString(),
      oldestMonth,
      currentMonth
    });
    
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
          month: {
            gte: oldestMonth,
            lte: currentMonth
          }
        }
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
    
    // If ANY metric type is missing AND we need historical data, fetch from LLM_DASHBOARD_URL
    if (needsHistoricalData && (!kpiDaily?.length || !kpiMonthly?.length || !channelDaily?.length || !sourceDaily?.length)) {
      console.log('GA Metrics API - Some metrics are missing, attempting to fetch from LLM dashboard');
      
      if (!process.env.LLM_DASHBOARD_URL) {
        console.log('GA Metrics API - LLM_DASHBOARD_URL not configured');
        return NextResponse.json(
          { error: 'No data found and LLM_DASHBOARD_URL not configured', code: 'NO_DATA' },
          { status: 404 }
        );
      }

      // Create a new import run record
      console.log('GA Metrics API - Creating import run record');
      const importRun = await prisma.gaImportRun.create({
        data: {
          gaPropertyId,
          dateStart: queryDateFrom,
          dateEnd: queryDateTo,
          requestedByUserId: user.id,
          status: 'ok'
        }
      });
      
      console.log('GA Metrics API - Import run created:', importRun.id);
      
      console.log('GA Metrics API - Fetching from LLM dashboard:', process.env.LLM_DASHBOARD_URL);
      const payload = {
        accountGA4,
        propertyGA4,
        dateStart: queryDateFrom.toISOString().split('T')[0],
        dateEnd: queryDateTo.toISOString().split('T')[0],
        runID: importRun.id
      };
      console.log('GA Metrics API - Request payload:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const llmResponse = await fetch(process.env.LLM_DASHBOARD_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          console.error('GA Metrics API - LLM dashboard request failed:', {
            status: llmResponse.status,
            statusText: llmResponse.statusText,
            error: errorText
          });
          throw new Error('Failed to fetch from LLM dashboard');
        }

        const llmData: LLMDashboardResponse = await llmResponse.json();
        console.log('GA Metrics API - Successfully fetched LLM dashboard data');

        try {
          const transformedData = transformLLMDashboardData(llmData);
          
          // Create import run
          console.log('GA Metrics API - Creating import run record');
          const importRun = await prisma.gaImportRun.create({
            data: {
              gaPropertyId,
              dateStart: queryDateFrom,
              dateEnd: queryDateTo,
              requestedByUserId: user.id,
              status: 'ok'
            }
          });
          console.log('GA Metrics API - Import run created:', importRun.id);

          // Store the transformed data in the database
          console.log('GA Metrics API - Storing transformed data in database');
          
          if (transformedData.kpiDaily?.length) {
            console.log('GA Metrics API - Storing daily KPI metrics');
            await Promise.all(
              transformedData.kpiDaily.map(day =>
                prisma.gaKpiDaily.upsert({
                  where: {
                    gaPropertyId_date: {
                      gaPropertyId,
                      date: new Date(day.date)
                    }
                  },
                  create: {
                    gaPropertyId,
                    date: new Date(day.date),
                    ...(() => { const { date, ...rest } = day; return rest; })()
                  },
                  update: {
                    ...(() => { const { date, ...rest } = day; return rest; })(),
                    date: new Date(day.date)
                  }
                })
              )
            );
          }

          if (transformedData.kpiMonthly?.length) {
            console.log('GA Metrics API - Storing monthly KPI metrics');
            await Promise.all(
              transformedData.kpiMonthly.map(month =>
                prisma.gaKpiMonthly.upsert({
                  where: {
                    gaPropertyId_month: {
                      gaPropertyId,
                      month: month.month
                    }
                  },
                  create: {
                    gaPropertyId,
                    month: month.month,
                    ...month
                  },
                  update: month
                })
              )
            );
          }

          if (transformedData.channelDaily?.length) {
            console.log('GA Metrics API - Storing channel metrics');
            const invalidChannelRecords: any[] = [];
            let channelLogCount = 0;
            await Promise.all(
              transformedData.channelDaily.map(channel => {
                if (channelLogCount < 5) {
                  console.log('channelDaily row keys:', Object.keys(channel), 'value:', channel);
                  channelLogCount++;
                }
                let safeDate;
                if (typeof channel.date !== 'string' || !channel.date.trim()) {
                  invalidChannelRecords.push({ channel, reason: 'Missing or invalid date field' });
                  return null;
                }
                if (typeof channel.date === 'string' && channel.date.length === 10) {
                  safeDate = new Date(channel.date + 'T00:00:00.000Z');
                } else {
                  safeDate = new Date(channel.date);
                }
                if (isNaN(safeDate.getTime())) {
                  invalidChannelRecords.push({ channel, reason: `Invalid date: ${channel.date}` });
                  return null;
                }
                return prisma.gaChannelDaily.upsert({
                  where: {
                    gaPropertyId_date_channelGroup: {
                      gaPropertyId,
                      date: safeDate,
                      channelGroup: channel.channelGroup
                    }
                  },
                  create: {
                    gaPropertyId,
                    date: safeDate,
                    channelGroup: channel.channelGroup,
                    ...(() => { const { date, channelGroup, ...rest } = channel; return rest; })()
                  },
                  update: {
                    ...(() => { const { date, channelGroup, ...rest } = channel; return rest; })(),
                    date: safeDate,
                    channelGroup: channel.channelGroup
                  }
                });
              }).filter(Boolean)
            );
            if (invalidChannelRecords.length > 0) {
              console.warn(`GA Metrics API - Skipped ${invalidChannelRecords.length} invalid channelDaily records:`);
              invalidChannelRecords.forEach((rec, idx) => {
                // console.warn(`  [${idx + 1}] Reason: ${rec.reason}, Value:`, rec.channel);
              });
            }
          }

          if (transformedData.sourceDaily?.length) {
            console.log('GA Metrics API - Storing source metrics');
            const invalidSourceRecords: any[] = [];
            let sourceLogCount = 0;
            await Promise.all(
              transformedData.sourceDaily.map(source => {
                if (sourceLogCount < 5) {
                  console.log('sourceDaily row keys:', Object.keys(source), 'value:', source);
                  sourceLogCount++;
                }
                let safeDate;
                if (typeof source.date !== 'string' || !source.date.trim()) {
                  invalidSourceRecords.push({ source, reason: 'Missing or invalid date field' });
                  return null;
                }
                if (typeof source.date === 'string' && source.date.length === 10) {
                  safeDate = new Date(source.date + 'T00:00:00.000Z');
                } else {
                  safeDate = new Date(source.date);
                }
                if (isNaN(safeDate.getTime())) {
                  invalidSourceRecords.push({ source, reason: `Invalid date: ${source.date}` });
                  return null;
                }
                return prisma.gaSourceDaily.upsert({
                  where: {
                    gaPropertyId_date_trafficSource: {
                      gaPropertyId,
                      date: safeDate,
                      trafficSource: source.trafficSource
                    }
                  },
                  create: {
                    gaPropertyId,
                    date: safeDate,
                    trafficSource: source.trafficSource,
                    ...(() => { const { date, trafficSource, ...rest } = source; return rest; })()
                  },
                  update: {
                    ...(() => { const { date, trafficSource, ...rest } = source; return rest; })(),
                    date: safeDate,
                    trafficSource: source.trafficSource
                  }
                });
              }).filter(Boolean)
            );
            if (invalidSourceRecords.length > 0) {
              console.warn(`GA Metrics API - Skipped ${invalidSourceRecords.length} invalid sourceDaily records:`);
              invalidSourceRecords.forEach((rec, idx) => {
                // console.warn(`  [${idx + 1}] Reason: ${rec.reason}, Value:`, rec.source);
              });
            }
          }

          console.log('GA Metrics API - All data stored successfully');
          return NextResponse.json(transformedData);
        } catch (error) {
          console.error('GA Metrics API - Error transforming or storing LLM data:', error);
          return NextResponse.json(
            { error: 'Invalid response format from LLM service', code: 'INVALID_FORMAT' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('GA Metrics API - Error fetching from LLM dashboard:', error);
        return NextResponse.json(
          { error: 'Failed to fetch from LLM dashboard', code: 'LLM_FETCH_ERROR' },
          { status: 500 }
        );
      }
    } else {
      console.log('GA Metrics API - Found existing metrics in database, returning those');
    }

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