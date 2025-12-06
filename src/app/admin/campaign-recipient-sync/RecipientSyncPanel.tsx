"use client";

import { useState, useTransition } from "react";
import { triggerCampaignRecipientSync, type CampaignRecipientSyncResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw } from "lucide-react";

export function RecipientSyncPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CampaignRecipientSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSync = () => {
    setError(null);
    setStatusMessage("Listing files in Google Drive...");
    startTransition(async () => {
      const response = await triggerCampaignRecipientSync();
      if (response.success) {
        setResult(response);
        setStatusMessage(
          `Parsed ${response.summary.filesFound} file${response.summary.filesFound === 1 ? "" : "s"} from Drive.`,
        );
      } else {
        setResult(null);
        setError(response.error);
        setStatusMessage(null);
      }
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Campaign Recipient Sync</h2>
        <p className="text-sm text-muted-foreground">
          Reads the "Scheduled Email" folder in Google Drive and parses CSV rows into normalized recipients.
          Requires a valid <code>GOOGLE_API_KEY</code> with read access to the folder.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSync} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Trigger Sync
            </>
          )}
        </Button>
        {result && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Processed {result.summary.filesFound} file{result.summary.filesFound === 1 ? "" : "s"}; matched{" "}
              {result.summary.filesMatched} to campaigns.
            </p>
            <p>
              Parsed {result.summary.recipientsParsed.toLocaleString()} recipient
              {result.summary.recipientsParsed === 1 ? "" : "s"}; inserted {result.summary.recipientsInserted.toLocaleString()}{" "}
              unique record{result.summary.recipientsInserted === 1 ? "" : "s"}.
            </p>
            {result.summary.unmatchedFiles.length > 0 && (
              <p className="text-amber-600">
                Unmatched files: {result.summary.unmatchedFiles.slice(0, 3).join(", ")}
                {result.summary.unmatchedFiles.length > 3 ? ` +${result.summary.unmatchedFiles.length - 3} more` : ""}
              </p>
            )}
          </div>
        )}
      </div>

      {statusMessage && isPending && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Sync failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
