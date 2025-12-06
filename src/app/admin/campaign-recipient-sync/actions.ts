'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  syncScheduledEmailRecipients,
  type CampaignRecipientSyncSummary,
} from '@/lib/services/campaign-recipient-sync';

export interface CampaignRecipientSyncResult {
  success: true;
  summary: CampaignRecipientSyncSummary;
}

export interface CampaignRecipientSyncError {
  success: false;
  error: string;
}

export async function triggerCampaignRecipientSync(): Promise<CampaignRecipientSyncResult | CampaignRecipientSyncError> {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const summary = await syncScheduledEmailRecipients();

    return {
      success: true,
      summary,
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
