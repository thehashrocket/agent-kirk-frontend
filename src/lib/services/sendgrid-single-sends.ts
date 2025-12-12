import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";

const SENDGRID_SINGLE_SENDS_URL = "https://api.sendgrid.com/v3/marketing/singlesends";
const DEFAULT_EMAIL_CLIENT_ID = "cb748305-1f88-45db-9f68-b73de19f44d9";
const PRIORITY_EMAIL_CLIENT_ID = "4d85f62e-4da5-4f2d-8f70-30c7f20410f8";
const PRIORITY_MARKERS = ["SEMO", "CFJX", "CFFM", "CFPB"];
const DEFAULT_PAGE_SIZE = 100;
const UPSERT_BATCH_SIZE = 25;

type SendGridSingleSend = {
  id: string;
  name: string;
  status?: string;
  categories?: string[];
  send_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_abtest?: boolean;
  abtest?: unknown;
};

interface NormalizedSingleSendsResponse {
  singleSends: SendGridSingleSend[];
  nextPageUrl?: string;
}

export interface SyncSendGridSingleSendsResult {
  fetched: number;
  upserted: number;
  skipped: number;
}

export type SyncSendGridProgressUpdate = {
  fetched: number;
  upserted: number;
  skipped: number;
  page: number;
  pageSize: number;
};

export async function syncSendGridSingleSends(
  apiKey?: string,
  onProgress?: (progress: SyncSendGridProgressUpdate) => void,
): Promise<SyncSendGridSingleSendsResult> {
  const resolvedApiKey = apiKey ?? process.env.SENDGRID_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("SENDGRID_API_KEY is required to fetch SendGrid single sends.");
  }

  let page = 0;
  let fetched = 0;
  const result: SyncSendGridSingleSendsResult = {
    upserted: 0,
    skipped: 0,
    fetched: 0,
  };

  let pageUrl: string | undefined = buildBaseUrl();

  do {
    page += 1;
    const { singleSends, nextPageUrl } = await fetchSingleSendsPage(resolvedApiKey, pageUrl);
    fetched += singleSends.length;

    const { upserted, skipped } = await upsertSingleSends(singleSends);
    result.upserted += upserted;
    result.skipped += skipped;
    result.fetched = fetched;

    onProgress?.({
      fetched,
      upserted: result.upserted,
      skipped: result.skipped,
      page,
      pageSize: singleSends.length,
    });

    pageUrl = nextPageUrl;
  } while (pageUrl);

  return result;
}

function buildBaseUrl(): string {
  const url = new URL(SENDGRID_SINGLE_SENDS_URL);
  url.searchParams.set("page_size", String(DEFAULT_PAGE_SIZE));
  return url.toString();
}

async function fetchSingleSendsPage(apiKey: string, pageUrl: string): Promise<NormalizedSingleSendsResponse> {
  const response = await fetch(pageUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `SendGrid single sends request failed: ${response.status} ${response.statusText}${details ? ` - ${details}` : ""}`,
    );
  }

  const payload = await response.json();
  return normalizeSingleSendsResponse(payload);
}

function normalizeSingleSendsResponse(payload: unknown): NormalizedSingleSendsResponse {
  if (Array.isArray(payload)) {
    return { singleSends: payload as SendGridSingleSend[] };
  }

  if (payload && typeof payload === "object") {
    const maybeResult =
      (payload as { result?: unknown; results?: unknown }).result ??
      (payload as { results?: unknown }).results;

    const resultArray = Array.isArray(maybeResult) ? (maybeResult as SendGridSingleSend[]) : [];

    const meta = (payload as { _metadata?: { next?: unknown } })._metadata;
    let nextPageUrl = meta && typeof meta === "object" && typeof meta.next === "string" ? meta.next : undefined;

    if (!nextPageUrl) {
      const nextPageToken = (payload as { next_page_token?: unknown }).next_page_token;
      if (typeof nextPageToken === "string" && nextPageToken) {
        const url = new URL(SENDGRID_SINGLE_SENDS_URL);
        url.searchParams.set("page_size", String(DEFAULT_PAGE_SIZE));
        url.searchParams.set("page_token", nextPageToken);
        nextPageUrl = url.toString();
      }
    }

    return { singleSends: resultArray, nextPageUrl };
  }

  return { singleSends: [] };
}

async function upsertSingleSends(singleSends: SendGridSingleSend[]): Promise<SyncSendGridSingleSendsResult> {
  const result: SyncSendGridSingleSendsResult = {
    fetched: singleSends.length,
    upserted: 0,
    skipped: 0,
  };

  for (const batch of chunk(singleSends, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map(async (singleSend) => {
        if (!singleSend?.id || !singleSend?.name) {
          result.skipped += 1;
          return;
        }

        const categories = normalizeCategories(singleSend.categories);
        const sendAt = parseSendGridDate(singleSend.send_at);
        const singleSendCreatedAt = parseSendGridDate(singleSend.created_at);
        const singleSendUpdatedAt = parseSendGridDate(singleSend.updated_at);
        const emailClientId = resolveEmailClientId(singleSend.name);
        const isAbTest = singleSend.is_abtest ?? false;

        await prisma.emailCampaign.upsert({
          where: { campaignId: singleSend.id },
          create: {
            campaignId: singleSend.id,
            campaignName: singleSend.name,
            emailClientId,
            status: singleSend.status ?? null,
            categories,
            sendAt,
            singleSendCreatedAt,
            singleSendUpdatedAt,
            isAbTest,
            abTest: (singleSend.abtest as Prisma.InputJsonValue) ?? Prisma.DbNull,
          },
          update: {
            campaignName: singleSend.name,
            emailClientId,
            status: singleSend.status ?? null,
            categories,
            sendAt,
            singleSendCreatedAt,
            singleSendUpdatedAt,
            isAbTest,
            abTest: (singleSend.abtest as Prisma.InputJsonValue) ?? Prisma.DbNull,
          },
        });

        result.upserted += 1;
      }),
    );
  }

  return result;
}

function normalizeCategories(categories: unknown): string[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.map((category) => String(category)).filter(Boolean);
}

function parseSendGridDate(dateValue: unknown): Date | null {
  if (!dateValue || typeof dateValue !== "string") {
    return null;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function resolveEmailClientId(name: string): string {
  const normalizedName = name.toUpperCase();

  if (PRIORITY_MARKERS.some((marker) => normalizedName.includes(marker))) {
    return PRIORITY_EMAIL_CLIENT_ID;
  }

  return DEFAULT_EMAIL_CLIENT_ID;
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
