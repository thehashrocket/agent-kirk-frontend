import { NextResponse } from "next/server";

import {
  syncSendGridSingleSends,
  type SyncSendGridProgressUpdate,
} from "@/lib/services/sendgrid-single-sends";

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      const startedAt = new Date().toISOString();

      try {
        send({ type: "start", startedAt });

        const result = await syncSendGridSingleSends(undefined, (progress: SyncSendGridProgressUpdate) => {
          send({ type: "progress", ...progress });
        });

        send({ type: "complete", ...result, startedAt, completedAt: new Date().toISOString() });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to sync SendGrid single sends.";
        console.error("SendGrid single sends sync failed", error);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
