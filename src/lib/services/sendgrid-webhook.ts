import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/client";

export type SendGridEventType =
  | "bounce"
  | "click"
  | "delivered"
  | "open"
  | "spamreport"
  | "unsubscribe";

export interface SendGridWebhookEvent {
  email?: string;
  event?: string;
  timestamp?: number;
  campaign_id?: string;
  campaignId?: string;
  marketing_campaign_id?: string;
  category?: string | string[];
  sg_message_id?: string;
  sgMessageId?: string;
  [key: string]: unknown;
}

interface SendGridWebhookResult {
  processed: number;
  skipped: Array<{
    email?: string;
    campaignId?: string;
    event?: string;
    reason: string;
  }>;
}

const eventTypeMap: Record<string, SendGridEventType> = {
  bounce: "bounce",
  click: "click",
  delivered: "delivered",
  open: "open",
  spamreport: "spamreport",
  spam_report: "spamreport",
  dropped: "bounce",
  unsubscribe: "unsubscribe",
  group_unsubscribe: "unsubscribe",
};

const normalizeCampaignId = (event: SendGridWebhookEvent) => {
  const explicitCampaignId =
    event.campaign_id ?? event.campaignId ?? event.marketing_campaign_id ?? undefined;

  if (explicitCampaignId) {
    return explicitCampaignId;
  }

  if (event.category) {
    if (Array.isArray(event.category)) {
      return event.category.find((value) => typeof value === "string");
    }

    if (typeof event.category === "string") {
      return event.category;
    }
  }

  return undefined;
};

const normalizeMessageId = (event: SendGridWebhookEvent) =>
  event.sg_message_id ?? event.sgMessageId ?? undefined;

const normalizeEventType = (event?: string): SendGridEventType | null => {
  if (!event) return null;
  const normalized = event.toLowerCase();
  return eventTypeMap[normalized] ?? null;
};

const resolveEventTimestamp = (event: SendGridWebhookEvent) =>
  event.timestamp ? new Date(event.timestamp * 1000) : new Date();

const updateLastEventAt = (existingDate: Date | null, incomingDate: Date) => {
  if (!existingDate) return incomingDate;
  return incomingDate > existingDate ? incomingDate : existingDate;
};

type RecipientUpdateContext = { id: string; uniqueOpens: number; lastEventAt: Date | null };

const buildUpdateInput = (
  eventType: SendGridEventType,
  currentRecipient: RecipientUpdateContext,
  eventTimestamp: Date,
): Prisma.CampaignRecipientsUpdateInput => {
  const data: Record<string, unknown> = {
    lastEventAt: updateLastEventAt(currentRecipient.lastEventAt, eventTimestamp),
  };

  switch (eventType) {
    case "delivered":
      data.delivered = { increment: 1 };
      break;
    case "open":
      data.opens = { increment: 1 };
      if (!currentRecipient.uniqueOpens) {
        data.uniqueOpens = { increment: 1 };
      }
      break;
    case "click":
      data.clicks = { increment: 1 };
      break;
    case "bounce":
      data.bounces = { increment: 1 };
      break;
    case "spamreport":
      data.spamReports = { increment: 1 };
      break;
    case "unsubscribe":
      data.unsubscribes = { increment: 1 };
      break;
  }

  return data as Prisma.CampaignRecipientsUpdateInput;
};

export async function handleSendGridEvents(events: SendGridWebhookEvent[]): Promise<SendGridWebhookResult> {
  const result: SendGridWebhookResult = { processed: 0, skipped: [] };

  for (const event of events) {
    const eventType = normalizeEventType(event.event);
    const email = event.email;
    const campaignId = normalizeCampaignId(event);
    const messageId = normalizeMessageId(event);

    if (!eventType) {
      result.skipped.push({ email, campaignId, event: event.event, reason: "unsupported event type" });
      continue;
    }

    if (!email && !messageId) {
      result.skipped.push({ campaignId, event: event.event, reason: "missing identifiers" });
      continue;
    }

    let emailCampaignId: string | null = null;

    if (campaignId) {
      const emailCampaign = await prisma.emailCampaign.findUnique({
        where: { campaignId },
        select: { id: true },
      });

      if (!emailCampaign) {
        result.skipped.push({ email, campaignId, event: event.event, reason: "campaign not found" });
        continue;
      }

      emailCampaignId = emailCampaign.id;
    }

    let recipient =
      emailCampaignId && email
        ? await prisma.campaignRecipients.findFirst({
            where: {
              emailCampaignId,
              email,
            },
            select: {
              id: true,
              uniqueOpens: true,
              lastEventAt: true,
            },
          })
        : null;

    if (!recipient && messageId) {
      recipient = await prisma.campaignRecipients.findFirst({
        where: {
          sendgridMessageId: messageId,
        },
        select: {
          id: true,
          uniqueOpens: true,
          lastEventAt: true,
        },
      });
    }

    if (!recipient) {
      result.skipped.push({
        email,
        campaignId,
        event: event.event,
        reason: messageId ? "recipient not found for message id" : "recipient not found",
      });
      continue;
    }

    const eventTimestamp = resolveEventTimestamp(event);
    const updateInput = buildUpdateInput(eventType, recipient, eventTimestamp);

    await prisma.campaignRecipients.update({
      where: { id: recipient.id },
      data: updateInput,
    });

    result.processed += 1;
  }

  return result;
}
