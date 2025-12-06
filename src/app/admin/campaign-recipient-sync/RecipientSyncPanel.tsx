"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  const [statusTrail, setStatusTrail] = useState<string[]>([]);
  const [progressStep, setProgressStep] = useState<number>(0);

  const handleSync = () => {
    setError(null);
    setProgressStep(0);
    setStatusTrail(["Listing files in Google Drive..."]);
    setStatusMessage("Listing files in Google Drive...");
    startTransition(async () => {
      const response = await triggerCampaignRecipientSync();
      if (response.success) {
        setResult(response);
        setStatusMessage(
          `Parsed ${response.summary.filesFound} file${response.summary.filesFound === 1 ? "" : "s"} from Drive.`,
        );
        setStatusTrail((trail) => [
          ...trail,
          "Matching filenames to email campaigns...",
          "Writing recipients to database...",
          "Sync completed.",
        ]);
      } else {
        setResult(null);
        setError(response.error);
        setStatusMessage(null);
        setStatusTrail([]);
      }
    });
  };

  useEffect(() => {
    if (!isPending) {
      return undefined;
    }

    const steps = [
      "Listing files in Google Drive...",
      "Matching filenames to email campaigns...",
      "Writing recipients to database...",
    ];

    setStatusMessage(steps[0]);
    setProgressStep(0);

    const timer = setInterval(() => {
      setProgressStep((prev) => {
        const next = (prev + 1) % steps.length;
        setStatusMessage(steps[next]);
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPending]);

  const durationDisplay = useMemo(() => {
    if (!result) return null;
    if (!Number.isFinite(result.durationMs)) return null;
    if (result.durationMs < 1000) {
      return `${result.durationMs} ms`;
    }
    return `${(result.durationMs / 1000).toFixed(1)} s`;
  }, [result]);

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
            <p className="text-xs text-muted-foreground">
              Completed at {new Date(result.completedAt).toLocaleString()} ({durationDisplay ?? "n/a"}).
            </p>
            {result.summary.unmatchedFiles.length > 0 && (
              <p className="text-amber-600">
                Unmatched files: {result.summary.unmatchedFiles.slice(0, 3).join(", ")}
                {result.summary.unmatchedFiles.length > 3 ? ` +${result.summary.unmatchedFiles.length - 3} more` : ""}
              </p>
            )}
            {result.summary.failedDownloads.length > 0 && (
              <div className="text-red-600">
                <p>
                  Failed to download {result.summary.failedDownloads.length} file
                  {result.summary.failedDownloads.length === 1 ? "" : "s"}:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.summary.failedDownloads.slice(0, 3).map((item) => (
                    <li key={item.fileName} className="text-xs">
                      {item.fileName} — {item.reason}
                    </li>
                  ))}
                  {result.summary.failedDownloads.length > 3 && (
                    <li className="text-xs">+{result.summary.failedDownloads.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {(statusMessage || statusTrail.length > 0) && (
        <div className="space-y-2">
          {statusMessage && isPending && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}
          {statusTrail.length > 0 && (
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              {statusTrail.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          )}
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
