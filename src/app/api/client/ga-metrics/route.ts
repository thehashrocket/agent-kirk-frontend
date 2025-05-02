import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { GaMetricsResponse, GaMetricsError } from '@/lib/types/ga-metrics';
import { $Enums } from '@prisma/client';

interface LLMDashboardResponse {
  runID: string;
  gaPropertyId: string;
  datasets: Array<{
    table: string;
    rows: string;
  }>;
}

// Helper function to calculate monthly aggregates
function calculateMonthlyMetrics(dailyRows: any[]) {
  const monthlyData: { [key: string]: any } = {};
  
  dailyRows.forEach(row => {
    const date = new Date(row.date);
    const monthKey = parseInt(
      date.getFullYear().toString() + 
      (date.getMonth() + 1).toString().padStart(2, '0')
    );
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        sessions: 0,
        screenPageViews: 0,
        engagedSessions: 0,
        totalSessionDuration: 0,
        goalCompletions: 0,
        month: monthKey
      };
    }
    
    monthlyData[monthKey].sessions += row.sessions;
    monthlyData[monthKey].screenPageViews += (row.sessions * row.screenPageViewsPerSession);
    monthlyData[monthKey].engagedSessions += Math.round(row.sessions * row.engagementRate);
    monthlyData[monthKey].totalSessionDuration += (row.sessions * row.avgSessionDurationSec);
    monthlyData[monthKey].goalCompletions += row.goalCompletions;
  });
  
  return Object.values(monthlyData).map(month => ({
    month: month.month,
    sessions: month.sessions,
    screenPageViewsPerSession: month.screenPageViews / month.sessions,
    engagementRate: month.engagedSessions / month.sessions,
    avgSessionDurationSec: month.totalSessionDuration / month.sessions,
    goalCompletions: month.goalCompletions,
    goalCompletionRate: month.goalCompletions / month.sessions
  }));
}

// Helper function to extract channel data
function extractChannelData(dailyRows: any[]) {
  const channelData: { [key: string]: any } = {};
  
  dailyRows.forEach(row => {
    const channelGroup = row.channelGroup || 'direct';
    if (!channelData[channelGroup]) {
      channelData[channelGroup] = {
        sessions: 0,
        screenPageViews: 0,
        engagedSessions: 0,
        totalSessionDuration: 0,
        goalCompletions: 0,
        date: row.date
      };
    }
    
    channelData[channelGroup].sessions += row.sessions;
    channelData[channelGroup].screenPageViews += (row.sessions * row.screenPageViewsPerSession);
    channelData[channelGroup].engagedSessions += Math.round(row.sessions * row.engagementRate);
    channelData[channelGroup].totalSessionDuration += (row.sessions * row.avgSessionDurationSec);
    channelData[channelGroup].goalCompletions += row.goalCompletions;
  });
  
  return Object.entries(channelData).map(([channelGroup, data]) => ({
    channelGroup,
    date: new Date(data.date),
    sessions: data.sessions,
    screenPageViewsPerSession: data.screenPageViews / data.sessions,
    engagementRate: data.engagedSessions / data.sessions,
    avgSessionDurationSec: data.totalSessionDuration / data.sessions,
    goalCompletions: data.goalCompletions,
    goalCompletionRate: data.goalCompletions / data.sessions
  }));
}

// Helper function to extract source data
function extractSourceData(dailyRows: any[]) {
  const sourceData: { [key: string]: any } = {};
  
  dailyRows.forEach(row => {
    const trafficSource = row.source || 'direct';
    if (!sourceData[trafficSource]) {
      sourceData[trafficSource] = {
        sessions: 0,
        screenPageViews: 0,
        engagedSessions: 0,
        totalSessionDuration: 0,
        goalCompletions: 0,
        date: row.date
      };
    }
    
    sourceData[trafficSource].sessions += row.sessions;
    sourceData[trafficSource].screenPageViews += (row.sessions * row.screenPageViewsPerSession);
    sourceData[trafficSource].engagedSessions += Math.round(row.sessions * row.engagementRate);
    sourceData[trafficSource].totalSessionDuration += (row.sessions * row.avgSessionDurationSec);
    sourceData[trafficSource].goalCompletions += row.goalCompletions;
  });
  
  return Object.entries(sourceData).map(([trafficSource, data]) => ({
    trafficSource,
    date: new Date(data.date),
    sessions: data.sessions,
    screenPageViewsPerSession: data.screenPageViews / data.sessions,
    engagementRate: data.engagedSessions / data.sessions,
    avgSessionDurationSec: data.totalSessionDuration / data.sessions,
    goalCompletions: data.goalCompletions,
    goalCompletionRate: data.goalCompletions / data.sessions
  }));
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
      console.error('Transform LLM Data - Invalid response format: Response is not an object');
      throw new Error('Invalid response format: Response is not an object');
    }

    if (!Array.isArray(normalizedResponse.datasets)) {
      console.error('Transform LLM Data - Invalid response format: datasets is not an array');
      console.log('Transform LLM Data - Available keys:', Object.keys(normalizedResponse));
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
          console.log('Transform LLM Data - Processing channel metrics, count:', rows.length);
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
          console.log('Transform LLM Data - Processing source metrics, count:', rows.length);
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
    
    // Try session-based auth first
    const session = await getServerSession(authOptions);
    console.log('GA Metrics API - Session:', JSON.stringify(session, null, 2));

    // If no session, try bearer token
    const authHeader = request.headers.get('authorization');
    console.log('GA Metrics API - Auth Header:', authHeader);

    let userEmail: string | undefined;

    if (session?.user?.email) {
      userEmail = session.user.email;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Look up user by ID (token is the user ID)
      const userFromToken = await prisma.user.findUnique({
        where: { id: token }
      });
      if (userFromToken?.email) {
        userEmail = userFromToken.email;
      }
    }

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

    const today = new Date();
    const fiveYearsAgo = new Date(today);
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    // Get current month in YYYYMM format
    const currentMonth = parseInt(
      today.getFullYear().toString() + 
      (today.getMonth() + 1).toString().padStart(2, '0')
    );

    // Fetch all metrics in parallel
    console.log('GA Metrics API - Checking database for existing metrics');
    const [kpiDaily, kpiMonthly, channelDaily, sourceDaily] = await Promise.all([
      prisma.gaKpiDaily.findFirst({
        where: {
          gaPropertyId,
          date: {
            gte: fiveYearsAgo,
            lte: today
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.gaKpiMonthly.findFirst({
        where: {
          gaPropertyId,
          month: currentMonth
        }
      }),
      prisma.gaChannelDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: fiveYearsAgo,
            lte: today
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.gaSourceDaily.findMany({
        where: {
          gaPropertyId,
          date: {
            gte: fiveYearsAgo,
            lte: today
          }
        },
        orderBy: { date: 'desc' }
      })
    ]);

    console.log('GA Metrics API - Database check results:', {
      hasKpiDaily: !!kpiDaily,
      hasKpiMonthly: !!kpiMonthly,
      channelDailyCount: channelDaily?.length || 0,
      sourceDailyCount: sourceDaily?.length || 0
    });

    // If ANY metric type is missing, fetch from LLM_DASHBOARD_URL
    if (!kpiDaily || !kpiMonthly || !channelDaily?.length || !sourceDaily?.length) {
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
          dateStart: fiveYearsAgo,
          dateEnd: today,
          requestedByUserId: user.id,
          status: 'ok'
        }
      });
      
      console.log('GA Metrics API - Import run created:', importRun.id);
      
      

      console.log('GA Metrics API - Fetching from LLM dashboard:', process.env.LLM_DASHBOARD_URL);
      const payload = {
        accountGA4,
        propertyGA4,
        dateStart: fiveYearsAgo.toISOString().split('T')[0],
        dateEnd: today.toISOString().split('T')[0],
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
              dateStart: fiveYearsAgo,
              dateEnd: today,
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

    // Return the GA metrics data from database
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
    });
  } catch (error) {
    console.error('Error fetching GA metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
} 