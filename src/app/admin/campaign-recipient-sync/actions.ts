'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  syncScheduledEmailRecipients,
  type SyncFolderInput,
  type CampaignRecipientSyncSummary,
} from '@/lib/services/campaign-recipient-sync';

export interface CampaignRecipientSyncResult {
  success: true;
  summary: CampaignRecipientSyncSummary;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  nextCursor: number | null;
  batchSize: number;
}

export interface CampaignRecipientSyncError {
  success: false;
  error: string;
}

export interface TriggerCampaignRecipientSyncParams {
  cursor?: number;
  batchSize?: number;
  folder?: SyncFolderInput;
  maxRuntimeMs?: number;
}

export async function triggerCampaignRecipientSync(
  params?: TriggerCampaignRecipientSyncParams,
): Promise<CampaignRecipientSyncResult | CampaignRecipientSyncError> {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const startedAt = new Date();
    const summary = await syncScheduledEmailRecipients({
      startIndex: params?.cursor ?? 0,
      batchSize: params?.batchSize,
      folder: params?.folder,
      maxRuntimeMs: params?.maxRuntimeMs,
    });
    if (summary.totalFiles === 0) {
      return {
        success: false,
        error: `No files found in folder "${summary.folderName}" (${summary.folderId}). Ensure the folder contains CSVs and your Google API key has access.`,
      };
    }
    const completedAt = new Date();
    const nextCursor =
      summary.processedRange.end + 1 < summary.totalFiles ? summary.processedRange.end + 1 : null;

    return {
      success: true,
      summary,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      nextCursor,
      batchSize: params?.batchSize ?? summary.processedFiles,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error while syncing recipients';
    console.error('Failed to sync campaign recipients:', error);
    return {
      success: false,
      error: message,
    };
  }
}
