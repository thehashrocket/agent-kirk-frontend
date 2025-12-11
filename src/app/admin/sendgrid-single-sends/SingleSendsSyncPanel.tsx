"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, CloudDownload, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  startedAt: string;
  completedAt: string;
}

export function SingleSendsSyncPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const duration = useMemo(() => {
    if (!result) return null;
    const diff = new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime();
    if (!Number.isFinite(diff) || diff < 0) return null;
    return diff < 1000 ? `${diff} ms` : `${(diff / 1000).toFixed(1)} s`;
  }, [result]);

  const handleSync = () => {
    setError(null);
    setResult(null);

    startTransition(async () => {
      const startedAt = new Date().toISOString();
      try {
        const response = await fetch("/api/sendgrid/single-sends", { method: "GET" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to sync SendGrid single sends.");
        }

        setResult({
          fetched: payload.fetched ?? 0,
          upserted: payload.upserted ?? 0,
          skipped: payload.skipped ?? 0,
          startedAt,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error during sync.";
        setError(message);
      }
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Sync Single Sends</h2>
        <p className="text-sm text-muted-foreground">
          Pulls SendGrid single sends and upserts EmailCampaign rows. Names containing SEMO, CFJX, CFFM, or CFPB map to the
          priority email client; all others map to the default client.
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
              <CloudDownload className="mr-2 h-4 w-4" />
              Run Single Sends Sync
            </>
          )}
        </Button>

        {result && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">Fetched {result.fetched}</Badge>
            <Badge>Upserted {result.upserted}</Badge>
            <Badge variant="outline">Skipped {result.skipped}</Badge>
            {duration ? <span className="text-xs text-muted-foreground">in {duration}</span> : null}
          </div>
        )}
      </div>

      {result ? (
        <Alert variant="default">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Sync complete</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Started at <span className="font-mono">{result.startedAt}</span>
            </p>
            <p>
              Completed at <span className="font-mono">{result.completedAt}</span>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sync failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
