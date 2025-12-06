import { NextResponse } from 'next/server';
import { getCampaignAggregationMetrics } from '@/lib/services/campaign-aggregation';

export async function GET(request: Request) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const emailClientId = searchParams.get('emailClientId');
        const uspsClientId = searchParams.get('uspsClientId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        // Validate required parameters
        if (!userId || !emailClientId || !uspsClientId) {
            return NextResponse.json(
                {
                    error: 'Missing required parameters',
                    details: 'userId, emailClientId, and uspsClientId are required query parameters',
                },
                { status: 400 }
            );
        }

        // Fetch campaign aggregation metrics
        const metrics = await getCampaignAggregationMetrics({
            userId,
            emailClientId,
            uspsClientId,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
        });

        // Return successful response
        return NextResponse.json({
            success: true,
            data: metrics,
            meta: {
                count: metrics.length,
                fromDate: fromDate || 'Not specified',
                toDate: toDate || 'Not specified',
            },
        });

    } catch (error) {
        console.error('Error fetching campaign aggregation data:', error);

        // Return meaningful error response
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                error: 'Failed to fetch campaign aggregation data',
                details: errorMessage,
                // Provide fallback empty structure
                fallback: {
                    success: false,
                    data: [],
                    meta: {
                        count: 0,
                    },
                },
            },
            { status: 500 }
        );
    }
}
