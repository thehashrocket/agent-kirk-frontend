import { NextResponse } from "next/server";

import { handleSendGridEvents, type SendGridWebhookEvent } from "@/lib/services/sendgrid-webhook";
console.info("SendGrid webhook: handler reached")
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // console.log("SendGrid webhook: received payload", { payload });
    // convert payload.category array to string for logging
    payload.forEach((event: SendGridWebhookEvent) => {
      if (Array.isArray(event.category)) {
        console.log('Categories(Array to String): ', event.category.join(", "));
      } else {
        console.log('Categories(Array to String): ', event.category);
      }
    });

    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: "Expected an array of webhook events" }, { status: 400 });
    }

    const result = await handleSendGridEvents(payload as SendGridWebhookEvent[]);

    return NextResponse.json({
      status: "ok",
      processed: result.processed,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error("Error processing SendGrid webhook", error);
    return NextResponse.json({ error: "Failed to process SendGrid webhook" }, { status: 500 });
  }
}
