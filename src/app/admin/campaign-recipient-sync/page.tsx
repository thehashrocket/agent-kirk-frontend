/**
 * @file src/app/admin/campaign-recipient-sync/page.tsx
 * Admin page to trigger Google Drive scheduled email recipient sync.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecipientSyncPanel } from "./RecipientSyncPanel";

export default async function CampaignRecipientSyncPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Recipient Sync</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trigger a pull from the Google Drive "Scheduled Email" folder to aggregate scheduled email recipients.
          </p>
        </header>

        <RecipientSyncPanel />
      </div>
    </div>
  );
}
