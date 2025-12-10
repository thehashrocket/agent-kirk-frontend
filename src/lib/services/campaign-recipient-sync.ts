/**
 * @file Campaign recipient sync service for pulling scheduled email recipients from Google Drive.
 *
 * The service lists files in a configured Drive folder (default is "Scheduled Email", also supports
 * "[00] Processed Lists") and parses CSV rows into typed recipient records. Responsibilities are
 * split across a Drive client, CSV parser, and the coordinating sync service to keep concerns
 * isolated and testable.
 */

import { prisma } from "@/lib/prisma";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_SHEETS_MIME_TYPE = "application/vnd.google-apps.spreadsheet";
const CSV_EXPORT_MIME_TYPE = "text/csv";
const GOOGLE_DRIVE_SHORTCUT_MIME_TYPE = "application/vnd.google-apps.shortcut";
const DRIVE_FOLDERS = {
  scheduledEmail: {
    id: "1jgYwsup7Pd6OaxsQVbrEWbLFRePHKRo9",
    name: "Scheduled Email",
  },
  processedLists: {
    id: "1cFUWnQDpdLWs47ZMSHiZ8SgF3cX6i5A1",
    name: "[00] Processed Lists",
  },
};

type DriveFolderKey = keyof typeof DRIVE_FOLDERS;
type DriveFolder = (typeof DRIVE_FOLDERS)[DriveFolderKey];
export type SyncFolderInput = DriveFolderKey | DriveFolder;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  shortcutDetails?: {
    targetId: string;
    targetMimeType?: string;
  };
}

export interface CampaignRecipient {
  addressId: string;
  addressLine1: string;
  stateProvinceRegion: string;
  city: string;
  postalCode: string;
  market: string;
  sector: string;
  email: string;
  coreSegment: string;
  subSegment: string;
}

export interface CampaignRecipientSyncSummary {
  totalFiles: number;
  processedFiles: number;
  filesMatched: number;
  recipientsParsed: number;
  recipientsInserted: number;
  recipientsExisting: number;
  unmatchedFiles: string[];
  failedDownloads: Array<{ fileName: string; reason: string }>;
  processedRange: { start: number; end: number };
}

interface DriveClient {
  listFilesInFolder(folderId: string): Promise<DriveFile[]>;
  downloadFile(file: DriveFile): Promise<string>;
}

interface CampaignRecipientParser {
  parse(csvContent: string): CampaignRecipient[];
}

class GoogleDriveClient implements DriveClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is required to access Google Drive folders.");
    }
    this.apiKey = apiKey;
  }

  async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    const strategies: Array<{
      includeAllDrives: boolean;
      corpora?: string;
      label: string;
    }> = [
        { includeAllDrives: true, label: "supportsAllDrives" },
        { includeAllDrives: true, corpora: "drive", label: "supportsAllDrives+drive" },
        { includeAllDrives: true, corpora: "allDrives", label: "supportsAllDrives+allDrives" },
        { includeAllDrives: false, label: "standard" },
      ];

    let lastError: unknown;

    for (const strategy of strategies) {
      try {
        const files: DriveFile[] = [];
        let pageToken: string | undefined;

        do {
          const params = new URLSearchParams({
            q: `'${folderId}' in parents and trashed = false`,
            fields: "files(id,name,mimeType,shortcutDetails(targetId,targetMimeType)),nextPageToken",
            key: this.apiKey,
          });

          if (strategy.includeAllDrives) {
            params.set("includeItemsFromAllDrives", "true");
            params.set("supportsAllDrives", "true");
          }

          if (strategy.corpora) {
            params.set("corpora", strategy.corpora);
          }

          if (pageToken) {
            params.set("pageToken", pageToken);
          }

          const response = await fetch(`${DRIVE_FILES_ENDPOINT}?${params.toString()}`);

          if (!response.ok) {
            const details = await response.text().catch(() => response.statusText);
            throw new Error(
              `Failed to list files in folder ${folderId} with strategy ${strategy.label}: ${response.statusText} ${details}`,
            );
          }

          const payload = await response.json();
          files.push(...(payload.files ?? []));
          pageToken = payload.nextPageToken;
        } while (pageToken);

        return files;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Retrying Drive list with next strategy after failure: ${message}`);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async downloadFile(file: DriveFile): Promise<string> {
    const resolvedFile = await this.resolveShortcutIfNeeded(file);
    const isSpreadsheet = resolvedFile.mimeType === GOOGLE_SHEETS_MIME_TYPE;
    const attempts = this.buildDownloadAttempts(resolvedFile, isSpreadsheet);
    const errors: string[] = [];

    for (const attempt of attempts) {
      const response = await fetch(attempt.url);

      if (response.ok) {
        return response.text();
      }

      const body = await response.text().catch(() => "");
      errors.push(
        `${attempt.label}: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`,
      );
    }

    throw new Error(`Failed to download file ${file.name}: ${errors.join("; ")}`);
  }

  private buildDownloadAttempts(file: DriveFile, isSpreadsheet: boolean) {
    const baseParams = new URLSearchParams({
      supportsAllDrives: "true",
    });

    if (this.apiKey) {
      baseParams.set("key", this.apiKey);
    }

    const attempts: Array<{ label: string; url: string }> = [];

    if (isSpreadsheet) {
      const exportParams = new URLSearchParams(baseParams);
      exportParams.set("mimeType", CSV_EXPORT_MIME_TYPE);
      attempts.push({
        label: "drive-export",
        url: `${DRIVE_FILES_ENDPOINT}/${file.id}/export?${exportParams.toString()}`,
      });
      attempts.push({
        label: "public-sheet-export",
        url: `https://docs.google.com/spreadsheets/d/${file.id}/export?format=csv`,
      });
    } else {
      const downloadParams = new URLSearchParams(baseParams);
      downloadParams.set("alt", "media");
      downloadParams.set("acknowledgeAbuse", "true");
      attempts.push({
        label: "drive-download",
        url: `${DRIVE_FILES_ENDPOINT}/${file.id}?${downloadParams.toString()}`,
      });
    }

    attempts.push({
      label: "public-direct",
      url: `https://drive.google.com/uc?export=download&id=${file.id}`,
    });

    return attempts;
  }

  private async resolveShortcutIfNeeded(file: DriveFile): Promise<DriveFile> {
    if (file.mimeType !== GOOGLE_DRIVE_SHORTCUT_MIME_TYPE) {
      return file;
    }

    const shortcut =
      file.shortcutDetails ?? (await this.fetchFileMetadata(file.id)).shortcutDetails;

    if (!shortcut?.targetId) {
      throw new Error(`Shortcut ${file.name} does not include target details.`);
    }

    if (!shortcut.targetMimeType) {
      const targetMetadata = await this.fetchFileMetadata(shortcut.targetId);
      return { id: shortcut.targetId, name: file.name, mimeType: targetMetadata.mimeType };
    }

    return {
      id: shortcut.targetId,
      name: file.name,
      mimeType: shortcut.targetMimeType,
    };
  }

  private async fetchFileMetadata(fileId: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      supportsAllDrives: "true",
      fields: "id,name,mimeType,shortcutDetails(targetId,targetMimeType)",
    });

    if (this.apiKey) {
      params.set("key", this.apiKey);
    }

    const response = await fetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata for file ${fileId}: ${response.statusText}`);
    }

    return response.json() as Promise<DriveFile>;
  }
}

class CsvCampaignRecipientParser implements CampaignRecipientParser {
  private readonly headerMap: Record<string, keyof CampaignRecipient> = {
    addressid: "addressId",
    address_line_1: "addressLine1",
    state_province_region: "stateProvinceRegion",
    city: "city",
    postal_code: "postalCode",
    market: "market",
    sector: "sector",
    email: "email",
    core_segment: "coreSegment",
    sub_segment: "subSegment",
  };

  parse(csvContent: string): CampaignRecipient[] {
    const trimmed = csvContent.trim();

    if (!trimmed) {
      return [];
    }

    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const [headerLine, ...dataLines] = lines;

    if (!headerLine) {
      return [];
    }

    const headers = this.tokenizeCsvLine(headerLine).map((header) => this.resolveHeader(header));
    const recipients: CampaignRecipient[] = [];

    dataLines.forEach((line) => {
      const values = this.tokenizeCsvLine(line);
      const candidate = this.mapRowToRecipient(headers, values);

      if (candidate) {
        recipients.push(candidate);
      }
    });

    return recipients;
  }

  private resolveHeader(rawHeader: string): keyof CampaignRecipient | null {
    const normalized = rawHeader.trim().toLowerCase();
    return this.headerMap[normalized] ?? null;
  }

  private mapRowToRecipient(
    headers: Array<keyof CampaignRecipient | null>,
    values: string[],
  ): CampaignRecipient | null {
    const record: Partial<CampaignRecipient> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = values[index]?.trim() ?? "";
    });

    if (!record.email) {
      return null;
    }

    return {
      addressId: record.addressId ?? "",
      addressLine1: record.addressLine1 ?? "",
      stateProvinceRegion: record.stateProvinceRegion ?? "",
      city: record.city ?? "",
      postalCode: record.postalCode ?? "",
      market: record.market ?? "",
      sector: record.sector ?? "",
      email: record.email ?? "",
      coreSegment: record.coreSegment ?? "",
      subSegment: record.subSegment ?? "",
    };
  }

  private tokenizeCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        const isEscapedQuote = inQuotes && line[i + 1] === '"';
        if (isEscapedQuote) {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  }
}

export class CampaignRecipientSyncService {
  constructor(
    private readonly driveClient: DriveClient,
    private readonly parser: CampaignRecipientParser,
    private readonly folder: DriveFolder,
  ) {}

  async listFolderFiles(): Promise<DriveFile[]> {
    return this.driveClient.listFilesInFolder(this.folder.id);
  }

  async fetchScheduledEmailRecipients(): Promise<CampaignRecipient[]> {
    const files = await this.listFolderFiles();
    const recipients: CampaignRecipient[] = [];

    for (const file of files) {
      const content = await this.driveClient.downloadFile(file);
      recipients.push(...this.parser.parse(content));
    }

    return recipients;
  }

  async syncAndPersistRecipients(options?: { startIndex?: number; batchSize?: number }): Promise<CampaignRecipientSyncSummary> {
    const files = await this.listFolderFiles();
    const startIndex = Math.max(options?.startIndex ?? 0, 0);
    const batchSize = options?.batchSize ?? files.length;
    const slice = files.slice(startIndex, startIndex + batchSize);

    const summary: CampaignRecipientSyncSummary = {
      totalFiles: files.length,
      processedFiles: slice.length,
      filesMatched: 0,
      recipientsParsed: 0,
      recipientsInserted: 0,
      recipientsExisting: 0,
      unmatchedFiles: [],
      failedDownloads: [],
      processedRange: {
        start: startIndex,
        end: startIndex + (slice.length > 0 ? slice.length - 1 : 0),
      },
    };

    for (const file of slice) {
      let content: string;
      try {
        content = await this.driveClient.downloadFile(file);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown download error";
        summary.failedDownloads.push({ fileName: file.name, reason });
        continue;
      }

      const recipients = this.parser.parse(content);
      summary.recipientsParsed += recipients.length;

      const campaign = await findEmailCampaignByFileName(file.name);

      if (!campaign) {
        summary.unmatchedFiles.push(file.name);
        continue;
      }

      summary.filesMatched += 1;
      const result = await persistRecipientsForCampaign(campaign.id, recipients);
      summary.recipientsInserted += result.inserted;
      summary.recipientsExisting += result.existing;
    }

    return summary;
  }
}

export async function listScheduledEmailFiles(folder?: SyncFolderInput): Promise<DriveFile[]> {
  return buildServiceWithFolder(folder).listFolderFiles();
}

export async function fetchScheduledEmailRecipients(
  folder?: SyncFolderInput,
): Promise<CampaignRecipient[]> {
  return buildServiceWithFolder(folder).fetchScheduledEmailRecipients();
}

export async function syncScheduledEmailRecipients(
  options?: { startIndex?: number; batchSize?: number; folder?: SyncFolderInput },
): Promise<CampaignRecipientSyncSummary> {
  return buildServiceWithFolder(options?.folder).syncAndPersistRecipients(options);
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim();
}

function buildCampaignNameCandidates(rawName: string): string[] {
  const base = stripExtension(rawName);
  const variants = new Set<string>();

  variants.add(base);
  variants.add(base.replace(/_/g, " "));
  variants.add(base.replace(/\s+/g, "_"));

  return Array.from(variants).filter((value) => value.trim().length > 0);
}

async function findEmailCampaignByFileName(fileName: string) {
  const candidates = buildCampaignNameCandidates(fileName);

  if (candidates.length === 0) {
    return null;
  }

  return prisma.emailCampaign.findFirst({
    where: {
      OR: candidates.map((candidate) => ({
        campaignName: { equals: candidate, mode: "insensitive" },
      })),
    },
    select: { id: true, campaignName: true },
  });
}

async function persistRecipientsForCampaign(
  emailCampaignId: string,
  recipients: CampaignRecipient[],
): Promise<{ inserted: number; existing: number }> {
  if (recipients.length === 0) {
    return { inserted: 0, existing: 0 };
  }

  const seenEmails = new Set<string>();
  const seenAddresses = new Set<string>();

  const data = recipients
    .map((recipient) => {
      const emailKey = recipient.email.trim().toLowerCase();
      const addressKey = buildAddressKey(recipient);

      if (emailKey && seenEmails.has(emailKey)) {
        return null;
      }

      if (addressKey && seenAddresses.has(addressKey)) {
        return null;
      }

      if (emailKey) {
        seenEmails.add(emailKey);
      }

      if (addressKey) {
        seenAddresses.add(addressKey);
      }

      return {
        emailCampaignId,
        email: recipient.email,
        addressId: recipient.addressId,
        address_1: recipient.addressLine1,
        city: recipient.city,
        state: recipient.stateProvinceRegion,
        zip: recipient.postalCode,
        sector: recipient.sector,
        market: recipient.market,
        coreSegment: recipient.coreSegment,
        subSegment: recipient.subSegment,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const BATCH_SIZE = 1000;
  let inserted = 0;
  let existing = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;

    const existingRows = await prisma.campaignRecipients.findMany({
      where: {
        emailCampaignId,
        email: { in: batch.map((item) => item.email).filter(Boolean) },
      },
      select: { id: true, email: true },
    });

    const existingByEmail = new Map(
      existingRows.map((row) => [row.email?.toLowerCase() ?? "", row.id]),
    );

    const createRows: typeof batch = [];
    const updateRows: Array<{ id: string; data: typeof batch[number] }> = [];

    for (const row of batch) {
      const key = row.email.toLowerCase();
      const existingId = existingByEmail.get(key);
      if (existingId) {
        updateRows.push({ id: existingId, data: row });
      } else {
        createRows.push(row);
      }
    }

    if (createRows.length > 0) {
      const createResult = await prisma.campaignRecipients.createMany({
        data: createRows,
        skipDuplicates: true,
      });
      inserted += createResult.count;
    }

    if (updateRows.length > 0) {
      await prisma.$transaction(
        updateRows.map((row) =>
          prisma.campaignRecipients.update({
            where: { id: row.id },
            data: row.data,
          }),
        ),
      );
      existing += updateRows.length;
    }
  }

  return { inserted, existing };
}

function buildAddressKey(recipient: CampaignRecipient): string {
  if (recipient.addressId) {
    return `id:${recipient.addressId.trim().toLowerCase()}`;
  }

  const parts = [
    recipient.addressLine1,
    recipient.city,
    recipient.stateProvinceRegion,
    recipient.postalCode,
  ]
    .map((part) => part?.trim().toLowerCase() ?? "")
    .filter((part) => part.length > 0);

  return parts.length > 0 ? `addr:${parts.join("|")}` : "";
}

function resolveFolder(folder: SyncFolderInput | undefined): DriveFolder {
  if (!folder) {
    return DRIVE_FOLDERS.scheduledEmail;
  }

  if (typeof folder === "string") {
    const resolved = DRIVE_FOLDERS[folder];
    if (!resolved) {
      throw new Error(`Unknown campaign recipient folder: ${folder}`);
    }
    return resolved;
  }

  return folder;
}

function buildServiceWithFolder(folder?: SyncFolderInput): CampaignRecipientSyncService {
  const apiKey = process.env.GOOGLE_API_KEY;
  const driveClient = new GoogleDriveClient(apiKey ?? "");
  const parser = new CsvCampaignRecipientParser();
  const resolvedFolder = resolveFolder(folder);

  return new CampaignRecipientSyncService(driveClient, parser, resolvedFolder);
}
