import { NextResponse } from "next/server";

import { syncSendGridSingleSends } from "@/lib/services/sendgrid-single-sends";

export async function GET() {
  try {
    const result = await syncSendGridSingleSends();

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync SendGrid single sends.";
    console.error("SendGrid single sends sync failed", error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
