# Services Overview

This directory hosts backend-facing service modules that encapsulate IO-heavy logic (Prisma queries, external APIs, parsing) for the KIRK frontend. Each service owns a focused concern and exposes typed entry points that are easy to compose at the API layer.

## Core Services

- `campaign-aggregation.ts` — Joins email and USPS metrics by campaign name to present unified channel performance over a date range.
- `campaign-recipient-sync.ts` — Google Drive client plus CSV parser that list files in the “Scheduled Email” folder and emit normalized recipient rows. Entry points: `listScheduledEmailFiles`, `fetchScheduledEmailRecipients`.
- `direct-mail-metrics.ts` — Pulls USPS campaign performance for authorized users via Prisma, returning table-friendly data and summary stats.
- `email-analytics.ts` — Aggregates email campaign metrics from `EmailCampaignDailyStats` and related tables. Key APIs: `EmailAnalyticsService.getGlobalMetrics`, `getCampaignActivity`, `parseDateRange`.
- `email-metrics.ts` — Shared email metric builder used by dashboards and cross-channel aggregation. Produces rollups (opens, clicks, delivery rates) and top campaign stats with optional date filtering.
- `reports.ts` — Generates system-wide and account-rep reports (user/activity metrics, ticket stats) with date filtering helpers.
- `saveGaMetrics.ts` — Persists Google Analytics metric payloads into Prisma; shapes data for later retrieval.
- `ticket-service.ts` — Ticket CRUD and status updates for role-based dashboards.

## Parsing & Utilities

- `parseLineGraphData.ts`, `parsePieGraphData.ts`, `parseForStorage.ts`, `parseLLMResponse.ts` — Transform metric payloads into chart-friendly structures or LLM-safe storage formats.

## Conventions

- **Single Responsibility**: Each module owns one domain (email metrics, direct mail, Drive sync) and exposes small, typed functions/classes.
- **Dependency Inversion**: Consumers depend on service interfaces/exports, not underlying Prisma shapes or API details.
- **Input Validation**: Date ranges and identifiers are validated/parsed at the service boundary; callers should still sanitize user input.
- **Environment**: External integrations rely on env vars (e.g., `GOOGLE_API_KEY` for Drive access). Ensure required secrets are present before invoking.

## Usage Notes

- Prefer calling the narrow entry points (e.g., `EmailAnalyticsService.getGlobalMetrics`, `fetchScheduledEmailRecipients`) from API routes or server components.
- When extending a service, add interfaces/types near the module and keep parsing/IO concerns separated for testability.
