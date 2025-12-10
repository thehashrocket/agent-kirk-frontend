import { NextResponse } from 'next/server';
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
console.info('recipient route hit')
export async function POST(req: Request) {
    console.info('hitting recipient route')
    const body = (await req.json()) as Payload;

    const { uspsCampaignId, emailCampaignId, recipients } = body;

    console.info('uspsCampaignId', uspsCampaignId)
    console.info('emailCampaignId', emailCampaignId)
    console.info('recipients', recipients)

    // if (!uspsCampaignId && !emailCampaignId) {
    //     return new NextResponse(
    //         JSON.stringify({ error: "Either uspsCampaignId or emailCampaignId is required" }),
    //         { status: 400 }
    //     );
    // }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return new NextResponse(
            JSON.stringify({ error: "No recipients provided" }),
            { status: 400 }
        );
    }

    // Verify campaign existence to prevent FK errors
    try {
        if (emailCampaignId) {
            const campaign = await prisma.emailCampaign.findUnique({
                where: { id: emailCampaignId },
            });
            if (!campaign) {
                return new NextResponse(
                    JSON.stringify({ error: `EmailCampaign with id ${emailCampaignId} not found` }),
                    { status: 404 }
                );
            }
        }

        if (uspsCampaignId) {
            const campaign = await prisma.uspsCampaign.findUnique({
                where: { id: uspsCampaignId },
            });
            if (!campaign) {
                return new NextResponse(
                    JSON.stringify({ error: `UspsCampaign with id ${uspsCampaignId} not found` }),
                    { status: 404 }
                );
            }
        }
    } catch (error) {
        console.error("Error validating campaign existence:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error during validation" }),
            { status: 500 }
        );
    }

    // Decide which unique constraint to use
    const isUsps = !!uspsCampaignId;

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // This could be optimized with a transaction + bulk upsert,
    // but a simple for..of loop is fine to start.
    try {
        for (const r of recipients) {
            try {
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
                successCount++;
            } catch (innerError: any) {
                failureCount++;
                console.error("Error processing recipient:", innerError);
                errors.push({
                    recipient: r,
                    error: innerError.message || "Unknown error",
                    code: innerError.code,
                });
            }
        }
    } catch (error) {
        console.error("Critical error in recipient processing loop:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error during processing" }),
            { status: 500 }
        );
    }

    return new Response(
        JSON.stringify({
            success: true,
            count: recipients.length,
            processed: {
                success: successCount,
                failed: failureCount,
            },
            errors: errors.length > 0 ? errors : undefined,
        }),
        { status: 200 }
    );
}