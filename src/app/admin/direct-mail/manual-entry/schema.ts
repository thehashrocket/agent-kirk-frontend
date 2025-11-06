/**
 * @file src/app/admin/direct-mail/manual-entry/schema.ts
 * Shared validation schema for USPS manual campaign entry.
 */

import { z } from "zod";

export const manualEntrySchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  campaignName: z
    .string()
    .min(1, "Campaign name is required")
    .max(191, "Campaign name is too long"),
  reportId: z
    .string()
    .regex(/^\d{6}$/, "Report ID must be a unique 6 digit value"),
  mailDate: z.coerce.date(),
  scanDate: z.coerce.date(),
  pieces: z.coerce
    .number()
    .int("Pieces must be a whole number")
    .positive("Pieces must be greater than zero"),
  totalScanned: z.coerce
    .number()
    .int("Total scanned must be a whole number")
    .min(0, "Total scanned cannot be negative"),
  numberDelivered: z.coerce
    .number()
    .int("Number delivered must be a whole number")
    .min(0, "Number delivered cannot be negative"),
  finalScanCount: z.coerce
    .number()
    .int("Final scan count must be a whole number")
    .min(0, "Final scan count cannot be negative"),
  percentScanned: z
    .coerce
    .number()
    .min(0, "Percent scanned cannot be negative")
    .max(100, "Percent scanned cannot exceed 100")
    .optional(),
  percentDelivered: z
    .coerce
    .number()
    .min(0, "Percent delivered cannot be negative")
    .max(100, "Percent delivered cannot exceed 100")
    .optional(),
  percentFinalScan: z
    .coerce
    .number()
    .min(0, "Percent final scan cannot be negative")
    .max(100, "Percent final scan cannot exceed 100")
    .optional(),
  percentOnTime: z
    .coerce
    .number()
    .min(0, "Percent on time cannot be negative")
    .max(100, "Percent on time cannot exceed 100")
    .optional(),
}).superRefine((data, ctx) => {
  if (Number.isNaN(data.mailDate.getTime())) {
    ctx.addIssue({
      path: ["mailDate"],
      code: z.ZodIssueCode.custom,
      message: "Mail date is required",
    });
  }

  if (Number.isNaN(data.scanDate.getTime())) {
    ctx.addIssue({
      path: ["scanDate"],
      code: z.ZodIssueCode.custom,
      message: "Scan date is required",
    });
  }

  if (data.scanDate < data.mailDate) {
    ctx.addIssue({
      path: ["scanDate"],
      code: z.ZodIssueCode.custom,
      message: "Scan date cannot be before mail date",
    });
  }
});

export type ManualEntryInput = z.infer<typeof manualEntrySchema>;
