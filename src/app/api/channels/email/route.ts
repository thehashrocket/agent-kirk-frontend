import { NextResponse } from 'next/server';
import { EmailAnalyticsService } from '@/lib/services/email-analytics';



export async function GET(request: Request) {
  try {
    // Parse query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    // Use provided date range or default to last 30 days
    const dateRange = EmailAnalyticsService.parseDateRange(startDate || undefined, endDate || undefined) 
      || EmailAnalyticsService.getDefaultDateRange();
    
    // Fetch data using our service layer
    const [metrics, campaignActivity] = await Promise.all([
      EmailAnalyticsService.getGlobalMetrics(dateRange),
      EmailAnalyticsService.getCampaignActivity(dateRange),
    ]);

    // Transform data to match existing component interface
    const response = {
      dateRange: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0],
      },
      metrics: {
        totalDeliveries: metrics.totalDeliveries,
        uniqueOpens: metrics.uniqueOpens,
        avgOpenRate: metrics.avgOpenRate,
        uniqueClicks: metrics.uniqueClicks,
        avgCTR: metrics.avgCTR,
        totalUnsubscribes: metrics.totalUnsubscribes,
        totalBounces: metrics.totalBounces,
      },
      campaignActivity: campaignActivity.map(campaign => ({
        id: campaign.id,
        delivered: campaign.delivered,
        weekDay: campaign.weekDay,
        subject: campaign.subject,
        link: campaign.link,
        successfulDeliveries: campaign.successfulDeliveries,
        opens: campaign.opens,
        openRate: campaign.openRate,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        unsubscribes: campaign.unsubscribes,
        bounces: campaign.bounces,
      })),
      // Website activity is kept as empty array for now
      // This can be populated later when Google Analytics integration is available
      websiteActivity: [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching email channel data:', error);
    
    // Return meaningful error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch email data',
        details: errorMessage,
        // Provide fallback empty structure to prevent UI crashes
        fallback: {
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
          metrics: {
            totalDeliveries: 0,
            uniqueOpens: 0,
            avgOpenRate: 0,
            uniqueClicks: 0,
            avgCTR: 0,
            totalUnsubscribes: 0,
            totalBounces: 0,
          },
          campaignActivity: [],
          websiteActivity: [],
        }
      },
      { status: 500 }
    );
  }
} 