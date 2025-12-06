"use client";

import { useMemo, useState, useTransition } from "react";
import {
  triggerCampaignRecipientSync,
  type CampaignRecipientSyncResult,
} from "./actions";
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
  const [aggregateSummary, setAggregateSummary] = useState<CampaignRecipientSyncResult | null>(null);

  const handleSync = () => {
    setError(null);
    setStatusTrail([]);
    setStatusMessage("Starting sync...");
    setAggregateSummary(null);
    const clientStart = Date.now();
    const batchSize = 3;

    startTransition(async () => {
      let cursor: number | null = 0;
      let aggregatedSummary: CampaignRecipientSyncResult["summary"] | null = null;

      try {
        while (cursor !== null) {
          const response = await triggerCampaignRecipientSync({ cursor, batchSize });
          setStatusMessage(
            `Processing files ${cursor + 1}-${Math.min(cursor + batchSize, response.summary.totalFiles)} of ${response.summary.totalFiles}...`,
          );

          if (!response.success) {
            setResult(null);
            setError(response.error);
            setStatusMessage(null);
            setStatusTrail([]);
            return;
          }

          aggregatedSummary = mergeSummaries(aggregatedSummary, response.summary);
          setAggregateSummary({
            ...response,
            summary: aggregatedSummary,
            startedAt: new Date(clientStart).toISOString(),
            completedAt: response.completedAt,
            durationMs: response.durationMs,
          });

          cursor = response.nextCursor;
        }

        if (aggregatedSummary) {
          const clientEnd = Date.now();
          setResult({
            success: true,
            summary: aggregatedSummary,
            startedAt: new Date(clientStart).toISOString(),
            completedAt: new Date(clientEnd).toISOString(),
            durationMs: clientEnd - clientStart,
            nextCursor: null,
            batchSize,
          });
          setStatusMessage("Sync completed.");
          setStatusTrail((trail) => [
            ...trail,
            "Matching filenames to email campaigns...",
            "Writing recipients to database...",
            "Sync completed.",
          ]);
        }
      } catch (err) {
        const message = buildFriendlyError(err);
        setResult(null);
        setError(message);
        setStatusMessage(null);
        setStatusTrail([]);
      }
    });
  };

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
        {!result && aggregateSummary && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Processing {aggregateSummary.summary.processedFiles} of {aggregateSummary.summary.totalFiles} files so far; matched{" "}
              {aggregateSummary.summary.filesMatched}.
            </p>
            <p>
              Parsed {aggregateSummary.summary.recipientsParsed.toLocaleString()} recipient
              {aggregateSummary.summary.recipientsParsed === 1 ? "" : "s"}; inserted{" "}
              {aggregateSummary.summary.recipientsInserted.toLocaleString()} unique record
              {aggregateSummary.summary.recipientsInserted === 1 ? "" : "s"}.
            </p>
          </div>
        )}

        {result && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Processed {result.summary.processedFiles} file{result.summary.processedFiles === 1 ? "" : "s"} of{" "}
              {result.summary.totalFiles}; matched {result.summary.filesMatched} to campaigns.
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
          <AlertDescription>
            {error}
            {error.toLowerCase().includes("timeout") && (
              <span className="block">
                The sync may be heavy; please retry in a moment or run during off-peak times.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}

function buildFriendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (/504|timeout/i.test(err.message)) {
      return "Gateway timeout while syncing. The sync likely took too long; please retry. Partial progress may have completed.";
    }
    return err.message;
  }
  return "Unexpected error during sync.";
}

function mergeSummaries(
  current: CampaignRecipientSyncResult["summary"] | null,
  next: CampaignRecipientSyncResult["summary"],
): CampaignRecipientSyncResult["summary"] {
  if (!current) {
    return {
      ...next,
      unmatchedFiles: [...next.unmatchedFiles],
      failedDownloads: [...next.failedDownloads],
      processedRange: next.processedRange,
    };
  }

  const processedFiles = current.processedFiles + next.processedFiles;

  return {
    totalFiles: next.totalFiles || current.totalFiles,
    processedFiles,
    filesMatched: current.filesMatched + next.filesMatched,
    recipientsParsed: current.recipientsParsed + next.recipientsParsed,
    recipientsInserted: current.recipientsInserted + next.recipientsInserted,
    unmatchedFiles: [...current.unmatchedFiles, ...next.unmatchedFiles],
    failedDownloads: [...current.failedDownloads, ...next.failedDownloads],
    processedRange: {
      start: 0,
      end: processedFiles > 0 ? processedFiles - 1 : 0,
    },
  };
}
