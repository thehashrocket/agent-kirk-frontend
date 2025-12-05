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

import { prisma } from "@/lib/prisma"; // adjust import

type RecipientInput = {
    email?: string | null;
    address_1?: string | null;
    address_2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    sector?: string | null;
    market?: string | null;
    addressId?: string | null;
    coreSegment?: string | null;
    subSegment?: string | null;
};

type Payload = {
    uspsCampaignId?: string | null;
    emailCampaignId?: string | null;
    recipients: RecipientInput[];
};

// App Router style:
export async function POST(req: Request) {
    const body = (await req.json()) as Payload;

    const { uspsCampaignId, emailCampaignId, recipients } = body;

    if (!uspsCampaignId && !emailCampaignId) {
        return new Response(
            JSON.stringify({ error: "Either uspsCampaignId or emailCampaignId is required" }),
            { status: 400 }
        );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return new Response(
            JSON.stringify({ error: "No recipients provided" }),
            { status: 400 }
        );
    }

    // Decide which unique constraint to use
    const isUsps = !!uspsCampaignId;

    // This could be optimized with a transaction + bulk upsert,
    // but a simple for..of loop is fine to start.
    for (const r of recipients) {
        const data = {
            email: r.email?.trim() || null,
            address_1: r.address_1?.trim() || null,
            address_2: r.address_2?.trim() || null,
            city: r.city?.trim() || null,
            state: r.state?.trim() || null,
            zip: r.zip?.trim() || null,
            sector: r.sector?.trim() || null,
            market: r.market?.trim() || null,
            addressId: r.addressId?.trim() || null,
            coreSegment: r.coreSegment?.trim() || null,
            subSegment: r.subSegment?.trim() || null,
            uspsCampaignId: uspsCampaignId ?? null,
            emailCampaignId: emailCampaignId ?? null,
        };

        if (isUsps) {
            if (!data.addressId) {
                // You might want to log this instead of throwing
                console.warn("Skipping recipient with no addressId for USPS campaign");
                continue;
            }

            await prisma.campaignRecipients.upsert({
                where: {
                    // uses @@unique([uspsCampaignId, addressId])
                    uniq_usps_campaign_address: {
                        uspsCampaignId: uspsCampaignId!,
                        addressId: data.addressId,
                    },
                },
                update: data,
                create: data,
            });
        } else {
            if (!data.email) {
                console.warn("Skipping recipient with no email for email campaign");
                continue;
            }

            await prisma.campaignRecipients.upsert({
                where: {
                    // uses @@unique([emailCampaignId, email])
                    uniq_email_campaign_email: {
                        emailCampaignId: emailCampaignId!,
                        email: data.email,
                    },
                },
                update: data,
                create: data,
            });
        }
    }

    return new Response(
        JSON.stringify({ success: true, count: recipients.length }),
        { status: 200 }
    );
}
