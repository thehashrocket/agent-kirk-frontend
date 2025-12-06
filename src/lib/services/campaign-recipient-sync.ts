/**
 * @file Campaign recipient sync service for pulling scheduled email recipients from Google Drive.
 *
 * The service lists files in the "Scheduled Email" Drive folder and parses CSV rows into typed
 * recipient records. Responsibilities are split across a Drive client, CSV parser, and the
 * coordinating sync service to keep concerns isolated and testable.
 */

import { prisma } from "@/lib/prisma";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_SHEETS_MIME_TYPE = "application/vnd.google-apps.spreadsheet";
const CSV_EXPORT_MIME_TYPE = "text/csv";
const SCHEDULED_EMAIL_FOLDER = {
  id: "1jgYwsup7Pd6OaxsQVbrEWbLFRePHKRo9",
  name: "Scheduled Email",
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
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
  filesFound: number;
  filesMatched: number;
  recipientsParsed: number;
  recipientsInserted: number;
  unmatchedFiles: string[];
  failedDownloads: Array<{ fileName: string; reason: string }>;
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
      throw new Error(
        `GOOGLE_API_KEY is required to access the ${SCHEDULED_EMAIL_FOLDER.name} folder in Google Drive.`,
      );
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
            fields: "files(id,name,mimeType),nextPageToken",
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
    const params = new URLSearchParams({
      key: this.apiKey,
      supportsAllDrives: "true",
    });
    const isSpreadsheet = file.mimeType === GOOGLE_SHEETS_MIME_TYPE;

    if (isSpreadsheet) {
      params.set("mimeType", CSV_EXPORT_MIME_TYPE);
    } else {
      params.set("alt", "media");
    }

    const url = isSpreadsheet
      ? `${DRIVE_FILES_ENDPOINT}/${file.id}/export?${params.toString()}`
      : `${DRIVE_FILES_ENDPOINT}/${file.id}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file ${file.name}: ${response.statusText}`);
    }

    return response.text();
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
  ) {}

  async listScheduledEmailFiles(): Promise<DriveFile[]> {
    return this.driveClient.listFilesInFolder(SCHEDULED_EMAIL_FOLDER.id);
  }

  async fetchScheduledEmailRecipients(): Promise<CampaignRecipient[]> {
    const files = await this.listScheduledEmailFiles();
    const recipients: CampaignRecipient[] = [];

    for (const file of files) {
      const content = await this.driveClient.downloadFile(file);
      recipients.push(...this.parser.parse(content));
    }

    return recipients;
  }

  async syncAndPersistRecipients(): Promise<CampaignRecipientSyncSummary> {
    const files = await this.listScheduledEmailFiles();
    const summary: CampaignRecipientSyncSummary = {
      filesFound: files.length,
      filesMatched: 0,
      recipientsParsed: 0,
      recipientsInserted: 0,
      unmatchedFiles: [],
      failedDownloads: [],
    };

    for (const file of files) {
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
      const created = await persistRecipientsForCampaign(campaign.id, recipients);
      summary.recipientsInserted += created;
    }

    return summary;
  }
}

function buildService(): CampaignRecipientSyncService {
  const apiKey = process.env.GOOGLE_API_KEY;
  const driveClient = new GoogleDriveClient(apiKey ?? "");
  const parser = new CsvCampaignRecipientParser();

  return new CampaignRecipientSyncService(driveClient, parser);
}

export async function listScheduledEmailFiles(): Promise<DriveFile[]> {
  return buildService().listScheduledEmailFiles();
}

export async function fetchScheduledEmailRecipients(): Promise<CampaignRecipient[]> {
  return buildService().fetchScheduledEmailRecipients();
}

export async function syncScheduledEmailRecipients(): Promise<CampaignRecipientSyncSummary> {
  return buildService().syncAndPersistRecipients();
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
): Promise<number> {
  if (recipients.length === 0) {
    return 0;
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

  const result = await prisma.campaignRecipients.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
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
