import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { SingleSendsSyncPanel } from "./SingleSendsSyncPanel";

export default async function SendGridSingleSendsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">SendGrid Single Sends</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trigger a fetch from SendGrid Marketing Single Sends to upsert campaigns into EmailCampaigns. Requires a valid
            <code className="mx-1">SENDGRID_API_KEY</code> configured on the server.
          </p>
        </header>

        <SingleSendsSyncPanel />
      </div>
    </div>
  );
}
