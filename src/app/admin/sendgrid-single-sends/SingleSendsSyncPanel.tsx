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

type StreamMessage =
  | { type: "start"; startedAt: string }
  | { type: "progress"; fetched: number; upserted: number; skipped: number; page: number; pageSize: number }
  | { type: "complete"; fetched: number; upserted: number; skipped: number; startedAt: string; completedAt: string }
  | { type: "error"; message: string };

type SyncProgress = {
  fetched: number;
  upserted: number;
  skipped: number;
  page: number;
  pageSize: number;
  startedAt: string;
};

export function SingleSendsSyncPanel() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const duration = useMemo(() => {
    if (!result) return null;
    const diff = new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime();
    if (!Number.isFinite(diff) || diff < 0) return null;
    return diff < 1000 ? `${diff} ms` : `${(diff / 1000).toFixed(1)} s`;
  }, [result]);

  const handleSync = () => {
    setError(null);
    setResult(null);
    setProgress(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/sendgrid/single-sends", { method: "GET" });

        if (!response.body) {
          throw new Error("No response stream from server.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completed = false;
        let startedAt: string | null = null;

        const processMessage = (raw: string) => {
          if (!raw.trim()) return;
          const message: StreamMessage = JSON.parse(raw);

          if (message.type === "start") {
            startedAt = message.startedAt;
            setProgress({
              fetched: 0,
              upserted: 0,
              skipped: 0,
              page: 0,
              pageSize: 0,
              startedAt,
            });
          } else if (message.type === "progress") {
            setProgress((current) => ({
              ...message,
              startedAt: current?.startedAt ?? startedAt ?? new Date().toISOString(),
            }));
          } else if (message.type === "complete") {
            completed = true;
            setResult({
              fetched: message.fetched,
              upserted: message.upserted,
              skipped: message.skipped,
              startedAt: message.startedAt,
              completedAt: message.completedAt,
            });
            setProgress(null);
          } else if (message.type === "error") {
            throw new Error(message.message);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            processMessage(line);
          }
        }

        if (buffer.trim()) {
          processMessage(buffer);
        }

        if (!completed) {
          throw new Error("Sync ended before completion.");
        }
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

      {progress ? (
        <Alert variant="default">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Sync in progress</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Page {progress.page} · fetched {progress.fetched} · upserted {progress.upserted} · skipped {progress.skipped}
            </p>
            <p className="text-xs text-muted-foreground">
              Started at <span className="font-mono">{progress.startedAt}</span>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

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
