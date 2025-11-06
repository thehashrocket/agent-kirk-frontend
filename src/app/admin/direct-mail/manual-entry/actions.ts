'use server';

/**
 * @file src/app/admin/direct-mail/manual-entry/actions.ts
 * Server action that persists USPS manual campaign entries.
 */

import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { manualEntrySchema } from './schema';
import type { ManualEntryInput } from './schema';

const privilegedCompanyName = '1905 New Media';
const privilegedCompanyNameLower = privilegedCompanyName.toLowerCase();

export async function createManualCampaign(input: ManualEntryInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  let companyName = session.user.company?.name;
  if (!companyName && session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true },
    });
    companyName = company?.name ?? null;
  }

  const canAccess =
    session.user.role === 'ADMIN' ||
    companyName?.toLowerCase() === privilegedCompanyNameLower;

  if (!canAccess) {
    return { error: 'Unauthorized' };
  }

  const parsed = manualEntrySchema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? 'Invalid form submission';
    return { error: message };
  }

  const data = parsed.data;

  const client = await prisma.uspsClient.findUnique({
    where: { id: data.clientId },
    select: { id: true },
  });

  if (!client) {
    return { error: 'Selected USPS client could not be found.' };
  }

  const [existingCampaignByName, existingCampaignByReport] = await Promise.all([
    prisma.uspsCampaign.findUnique({
      where: { campaignName: data.campaignName },
      select: { id: true },
    }),
    prisma.uspsCampaign.findFirst({
      where: { reportId: data.reportId },
      select: { id: true },
    }),
  ]);

  if (existingCampaignByName) {
    return { error: 'A campaign with that name already exists.' };
  }

  if (existingCampaignByReport) {
    return { error: 'Report ID is already assigned to another campaign.' };
  }

  const percentDefaults = {
    percentScanned: data.percentScanned ?? 100,
    percentDelivered: data.percentDelivered ?? 100,
    percentFinalScan: data.percentFinalScan ?? 100,
    percentOnTime: data.percentOnTime ?? 100,
  };

  try {
    const campaign = await prisma.$transaction(async (tx) => {
      const createdCampaign = await tx.uspsCampaign.create({
        data: {
          campaignName: data.campaignName,
          order: data.campaignName,
          reportId: data.reportId,
          sendDate: data.mailDate,
          uspsClientId: data.clientId,
        },
        select: { id: true },
      });

      await tx.uspsCampaignSummary.create({
        data: {
          uspsCampaignId: createdCampaign.id,
          reportId: data.reportId,
          mailDate: data.mailDate,
          scanDate: data.scanDate,
          pieces: data.pieces,
          totalScanned: data.totalScanned ?? data.pieces,
          numberDelivered: data.numberDelivered ?? data.pieces,
          finalScanCount: data.finalScanCount ?? data.pieces,
          ...percentDefaults,
        },
      });

      return createdCampaign;
    });

    return { success: true, campaignId: campaign.id };
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return { error: 'A unique constraint was violated while creating the records.' };
    }
    console.error('Error creating manual USPS campaign:', error);
    return { error: 'Unable to create campaign. Please try again.' };
  }
}
