import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/client";

export type SendGridEventType =
  | "bounce"
  | "click"
  | "deferred"
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
  singlesend_id?: string;
  singlesendId?: string;
  singlesend_name?: string;
  singlesendName?: string;
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
  deferred: "deferred",
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
    event.campaign_id ??
    event.campaignId ??
    event.marketing_campaign_id ??
    event.singlesend_id ??
    event.singlesendId ??
    undefined;

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

const normalizeCampaignName = (event: SendGridWebhookEvent) => {
  if (event.singlesend_name || event.singlesendName) {
    return (event.singlesend_name ?? event.singlesendName) as string;
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
type RecipientCounters = {
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  bounces: number;
  spamReports: number;
  unsubscribes: number;
};

let sendgridMessageIdSupported = true;

const isSendgridMessageIdValidationError = (error: unknown) =>
  error instanceof Error && error.message.includes("sendgridMessageId");

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";

const attachMessageId = <T extends Record<string, unknown>>(data: T, messageId?: string) => {
  if (sendgridMessageIdSupported && messageId) {
    (data as Record<string, unknown>).sendgridMessageId = messageId;
  }
  return data;
};

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
    case "deferred":
      // No counter increment; we still update lastEventAt/create recipients.
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

  if (!currentRecipient.lastEventAt) {
    data.lastEventAt = eventTimestamp;
  }

  return data as Prisma.CampaignRecipientsUpdateInput;
};

export async function handleSendGridEvents(events: SendGridWebhookEvent[]): Promise<SendGridWebhookResult> {
  const result: SendGridWebhookResult = { processed: 0, skipped: [] };

  for (const event of events) {
    const eventType = normalizeEventType(event.event);
    const email = event.email;
    const campaignId = normalizeCampaignId(event);
    const campaignName = normalizeCampaignName(event);
    const messageId = normalizeMessageId(event);

    if (!eventType) {
      console.info("SendGrid webhook: skipping unsupported event type", { event: event.event, email });
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
        console.warn("SendGrid webhook: campaign not found for campaignId", { campaignId, email });
        result.skipped.push({ email, campaignId, event: event.event, reason: "campaign not found" });
        continue;
      }

      emailCampaignId = emailCampaign.id;
    } else if (campaignName) {
      const emailCampaign = await prisma.emailCampaign.findFirst({
        where: { campaignName },
        select: { id: true, campaignId: true },
      });

      if (!emailCampaign) {
        console.warn("SendGrid webhook: campaign not found for campaignName", { campaignName, email });
        result.skipped.push({
          email,
          event: event.event,
          reason: "campaign not found for name",
        });
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

    if (!recipient && messageId && sendgridMessageIdSupported) {
      try {
        const where = attachMessageId({}, messageId) as Prisma.CampaignRecipientsWhereInput;
        recipient = await prisma.campaignRecipients.findFirst({
          where,
          select: {
            id: true,
            uniqueOpens: true,
            lastEventAt: true,
          },
        });
      } catch (error) {
        if (isSendgridMessageIdValidationError(error)) {
          sendgridMessageIdSupported = false;
          console.warn("sendgridMessageId not supported by current Prisma client/schema; disabling messageId lookup.");
        } else {
          throw error;
        }
      }
    }

    const eventTimestamp = resolveEventTimestamp(event);

    if (!recipient) {
      if (!emailCampaignId) {
        console.warn("SendGrid webhook: unable to resolve campaign for event", {
          email,
          campaignId,
          campaignName,
          messageId,
          event: event.event,
        });
        result.skipped.push({
          email,
          campaignId,
          event: event.event,
          reason: messageId ? "recipient not found for message id" : "recipient not found",
        });
        continue;
      }

      const counters: RecipientCounters = {
        delivered: eventType === "delivered" ? 1 : 0,
        opens: eventType === "open" ? 1 : 0,
        uniqueOpens: eventType === "open" ? 1 : 0,
        clicks: eventType === "click" ? 1 : 0,
        bounces: eventType === "bounce" ? 1 : 0,
        spamReports: eventType === "spamreport" ? 1 : 0,
        unsubscribes: eventType === "unsubscribe" ? 1 : 0,
      };

      try {
        const createData = attachMessageId(
          {
            email: email ?? null,
            emailCampaign: { connect: { id: emailCampaignId } },
            lastEventAt: eventTimestamp,
            ...counters,
          } as Record<string, unknown>,
          messageId,
        ) as Prisma.CampaignRecipientsCreateInput;

        await prisma.campaignRecipients.create({
          data: createData,
        });

        console.info("SendGrid webhook: created campaign recipient", {
          email,
          campaignId,
          messageId,
          event: event.event,
        });

        result.processed += 1;
      } catch (error) {
        if (sendgridMessageIdSupported && isSendgridMessageIdValidationError(error)) {
          sendgridMessageIdSupported = false;
          console.warn("sendgridMessageId not supported by current Prisma client/schema; retrying create without it.");
          try {
            const createDataWithoutMessageId = {
              email: email ?? null,
              emailCampaign: { connect: { id: emailCampaignId } },
              lastEventAt: eventTimestamp,
              ...counters,
            } as Prisma.CampaignRecipientsCreateInput;

            await prisma.campaignRecipients.create({
              data: createDataWithoutMessageId,
            });
            console.info("SendGrid webhook: created campaign recipient (without messageId)", {
              email,
              campaignId,
              event: event.event,
            });
            result.processed += 1;
            continue;
          } catch (innerError) {
            console.error("Failed to create CampaignRecipient after disabling sendgridMessageId", innerError);
          }
        }
        if (isUniqueConstraintError(error) && email) {
          console.warn("SendGrid webhook: recipient exists, retrying update instead of create", {
            email,
            campaignId,
            event: event.event,
          });
          const existing = await prisma.campaignRecipients.findFirst({
            where: { emailCampaignId, email },
            select: {
              id: true,
              uniqueOpens: true,
              lastEventAt: true,
            },
          });

          if (existing) {
            const updateInput = buildUpdateInput(eventType, existing, eventTimestamp);
            const includeMessageId = sendgridMessageIdSupported && messageId;
            const updateData = includeMessageId
              ? (attachMessageId({ ...updateInput } as Record<string, unknown>, messageId) as Prisma.CampaignRecipientsUpdateInput)
              : updateInput;

            try {
              await prisma.campaignRecipients.update({
                where: { id: existing.id },
                data: updateData,
              });
              console.info("SendGrid webhook: updated existing campaign recipient after unique conflict", {
                recipientId: existing.id,
                campaignId,
                email,
                event: event.event,
              });
              result.processed += 1;
              continue;
            } catch (updateError) {
              console.error("Failed to update CampaignRecipient after unique conflict", updateError);
            }
          }
        }
        console.error("Failed to create CampaignRecipient from webhook", error);
        result.skipped.push({
          email,
          campaignId,
          event: event.event,
          reason: "failed to create recipient",
        });
      }

      continue;
    }

    const updateInput = buildUpdateInput(eventType, recipient, eventTimestamp);

    const includeMessageId = sendgridMessageIdSupported && messageId;
    const updateData = includeMessageId
      ? (attachMessageId({ ...updateInput } as Record<string, unknown>, messageId) as Prisma.CampaignRecipientsUpdateInput)
      : updateInput;

    try {
      await prisma.campaignRecipients.update({
        where: { id: recipient.id },
        data: updateData,
      });
      console.info("SendGrid webhook: updated campaign recipient", {
        recipientId: recipient.id,
        campaignId,
        email,
        messageId: includeMessageId ? messageId : undefined,
        event: event.event,
      });
    } catch (error) {
      if (includeMessageId && isSendgridMessageIdValidationError(error)) {
        sendgridMessageIdSupported = false;
        console.warn("sendgridMessageId not supported by current Prisma client/schema; retrying update without it.");
        await prisma.campaignRecipients.update({
          where: { id: recipient.id },
          data: updateInput,
        });
        console.info("SendGrid webhook: updated campaign recipient (without messageId)", {
          recipientId: recipient.id,
          campaignId,
          email,
          event: event.event,
        });
      } else {
        throw error;
      }
    }

    result.processed += 1;
  }

  return result;
}
