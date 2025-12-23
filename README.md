# Kirk Frontend

Kirk is a role-driven marketing operations dashboard built with Next.js. The frontend bundles admin, account representative, and client experiences into a single App Router application. It surfaces cross-channel analytics, LLM-assisted insights, ticketing, messaging, and company management on top of a Prisma/PostgreSQL data layer.

## Table of Contents
- [Tech Stack](#tech-stack)
- [User Roles & Core Features](#user-roles--core-features)
- [Architecture Overview](#architecture-overview)
- [Key Directories](#key-directories)
- [Prisma Schema Diagram](#prisma-schema-diagram)
- [API Surface](#api-surface)
- [Data & Background Jobs](#data--background-jobs)
- [External Integrations](#external-integrations)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Quality & Tooling](#quality--tooling)
- [Deployment Notes](#deployment-notes)
- [Additional Resources](#additional-resources)

## Tech Stack
- **Framework**: Next.js 15 (App Router, React 19, Server Components)
- **Language**: TypeScript throughout the repo
- **Styling**: Tailwind CSS with shadcn/ui primitives and lucide-react icons
- **State/Data**: React Query, SWR, Jotai, Zustand (providers only), custom hooks in `src/hooks`
- **Backend**: Next.js API routes with Prisma ORM targeting PostgreSQL
- **Auth**: NextAuth.js (Google & Azure AD OAuth, JWT sessions)
- **Async/LLM**: Custom `/api/llm` routes proxying an external LLM service
- **Notifications**: SendGrid (email), Sonner toasts, Mailgun webhook helper

## User Roles & Core Features
| Role | Core Destinations | Highlights |
| ---- | ----------------- | ---------- |
| **Admin** | `/admin/dashboard`, `/admin/users`, `/admin/client-analytics`, `/admin/tickets`, `/admin/messages` | System health KPIs, user lifecycle management (including company assignment), GA account provisioning, cross-channel analytics, ticket triage, broadcast messaging. |
| **Account Rep** | `/account-rep/dashboard`, `/account-rep/clients`, `/account-rep/client-analytics`, `/account-rep/messages`, `/account-rep/profile` | Client roster management with company linkage, direct mail/email/GA insights, password resets via Mailgun, LLM-guided analytics conversations and saved reports. |
| **Client** | `/client/dashboard`, `/client/messages`, `/client/profile` | Personalized analytics, conversation assistant (Chat), notification center, onboarding to choose/create company. |
| **Shared** | `/chat`, `/reports`, `/analytics` | Conversation workspace with GA/property context, printable analytics views, saved reports, notifications, weather widget. |

Additional capabilities:
- **Onboarding**: `/onboarding/step1` lets new users search or create companies and attaches the selection to their profile.
- **Ticketing**: `/tickets` namespace (per role) for issue tracking with comments and status updates.
- **LLM Insights**: Conversations, report generation, and analytics questions route through `/api/llm` endpoints backed by a remote LLM microservice.
- **Notifications**: `/api/notifications` supports unread/read states, bulk clear, and email follow-ups via SendGrid.

## Architecture Overview
- **App Router**: Route groups under `src/app` segment the experience by role and feature. Client components handle dashboards and interactive tables; server components fetch heavier analytics payloads.
- **Providers**: `src/providers` houses context wrappers (Auth, React Query, sidebar state). They are composed in `src/app/layout.tsx`.
- **State & Hooks**: SWR hooks (`src/hooks/use-users`, etc.) back list views. React Query handles chat, analytics, and association fetches. Debounced search, chart helpers, and ticket utilities live here as well.
- **UI Layer**: Shared UI is in `src/components/ui` (shadcn). Feature-specific components live under `src/components/{domain}` (e.g., `admin`, `account-rep`, `chat`).
- **API Layer**: REST endpoints in `src/app/api/**` encapsulate server logic—role-aware authorization, Prisma queries, external API bridges (Mailgun, GA, weather, LLM), and reporting exports.
- **Data Models**: Prisma schema (`prisma/schema.prisma`) defines users, companies, GA accounts/properties, ticketing, notifications, logs, etc. Many-to-many tables support analytics integrations (email clients, Sprout Social, USPS direct mail).
- **Auth Flow**: NextAuth checks OAuth logins, auto-creates users, and enforces role-specific access. JWT callbacks enrich tokens with role/company data, refreshed on session update.
- **Companies**: `/api/companies` exposes search/create. The new `CompanySearchSelect` component (in `src/components/users`) is used across user creation flows to attach a `companyId` when applicable.

## Key Directories
| Path | Purpose |
| ---- | ------- |
| `src/app` | Next.js route segments, layouts, and server actions. Role-specific areas live under `admin`, `account-rep`, `client`, etc. |
| `src/app/actions` | Server actions (e.g., conversation helpers) shared across routes. |
| `src/app/api` | REST and serverless endpoints for analytics, LLM, auth, company search, tickets, notifications, etc. |
| `src/components/ui` | shadcn-based primitives (`button`, `dialog`, `table`, etc.). |
| `src/components/*` | Feature modules (dashboards, analytics widgets, messaging UI, onboarding flow, etc.). |
| `src/hooks` | SWR/React Query hooks for tickets, users, reports, chart data, debouncing. |
| `src/lib` | Business logic (admin metrics, auth, API clients, validations, Prisma helper). Subfolders include `services` and `api` integrations. |
| `src/providers` | Global React providers (AuthProvider, QueryProvider, SidebarProvider). |
| `prisma` | Prisma schema, migrations, seed script, sample data. Generated client is emitted to `src/prisma/generated`. |
| `scripts` | Maintenance scripts (duplicate cleanup for GA accounts/conversations). |
| `public` | Static assets and favicons. |

## Prisma Schema Diagram
See `docs/prisma-schema-diagram.md` for a Mermaid ER diagram generated from `prisma/schema.prisma`.

Regenerate with:
```bash
pnpm prisma:diagram
```

## API Surface
The table below summarizes the most active API route groups. Review the source under `src/app/api` for request/response contracts.

| Route Group | Description |
| ----------- | ----------- |
| `/api/users` | CRUD, role updates, company assignment, GA associations, per-user settings, account rep helpers. |
| `/api/companies` | Debounced search and creation for company onboarding or assignment. |
| `/api/admin/*` | Admin analytics and account provisioning endpoints. |
| `/api/account-rep/*` | Data feeds tailored to account representatives (email, direct mail, Sprout Social metrics). |
| `/api/client/*` | Client-facing analytics (GA metrics, email, direct mail) plus stats summary. |
| `/api/conversations` | Conversation CRUD and GA/client context management. Includes `/queries` sub-route for LLM queries/charts. |
| `/api/llm/*` | Proxies to external LLM service for chat, status polling, webhooks, and history. |
| `/api/reports` | Generates and aggregates analytics report data, including LLM metrics and account rep summaries. |
| `/api/tickets` | Ticket CRUD, comments, ownership changes. |
| `/api/messages` | Messaging inbox/outbox endpoints. |
| `/api/notifications` | Notification feed, read state, and clearing. |
| `/api/mailgun` | Sends transactional email (password reset) via Mailgun. |
| `/api/weather` | Fetches forecast data for dashboards using OpenWeatherMap. |
| `/api/roles` | Lists available roles; used by creation dialogs. |

## Data & Background Jobs
- **Database**: PostgreSQL with Prisma as the ORM (`DATABASE_URL` controls the connection). Run `start-database.sh` to spin up a local Docker container configured from `.env`.
- **Migrations**: Stored in `prisma/migrations`. Apply with `pnpm prisma migrate deploy` (or `pnpm prisma migrate dev --name <migration>` during development).
- **Seed Data**: `pnpm db:seed` executes `prisma/seed.ts` via `ts-node` to populate baseline roles, demo accounts, and analytics fixtures.
- **Maintenance Scripts**: Scripts in `scripts/` remove duplicate GA accounts or conversations; execute with `pnpm tsx scripts/<script>.ts`.

## External Integrations
| Integration | Usage | Notes |
| ----------- | ----- | ----- |
| **NextAuth (Google & Azure AD)** | Primary sign-in. Roles and company data are loaded post-login. | Configure OAuth credentials in `.env`. |
| **LLM Service** | `/api/llm` endpoints post to `LLM_SERVICE_URL` for chat, chart generation, and webhook callbacks. | Requires the remote service to honor Kirk's callback schema. |
| **SendGrid** | Email notifications for messages/reports (`src/lib/email.ts`). | Needs API key and from-address. |
| **Mailgun** | Password reset emails initiated by account reps. | `MAILGUN_API_KEY` and `MAILGUN_FROM` required. |
| **Upstash Redis/Ratelimit** | Task throttling and caching for LLM/chat workflows. | Configure `UPSTASH_REDIS_REST_URL` / token if added to `.env`. |
| **OpenWeatherMap** | Dashboard weather card. | Controlled by `OPENWEATHERMAP_API_KEY`. |
| **Google Analytics / Sprout Social / USPS** | Data sources represented in Prisma schema; ingestion happens via associated background services not included here. |

## Environment Variables
| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | Postgres connection string used by Prisma and the database start script. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth credentials for Google sign-in. |
| `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` | OAuth credentials for Microsoft/Azure AD. Tenant ID is optional (defaults to `common`). |
| `NEXTAUTH_URL` | Base URL NextAuth uses for callbacks and email templates. |
| `APP_ENV` | Custom flag consumed in `src/app/layout.tsx` to toggle environment banners. |
| `NEXT_PUBLIC_BASE_URL` | Public origin used when building password reset links for clients. |
| `NEXT_PUBLIC_APP_URL` | Client dashboard link builder for profile flows. |
| `WEBSITE_URL` | Passed to LLM service when sending chat payloads. |
| `LLM_SERVICE_URL` | Base URL for the external LLM service. |
| `MAILGUN_API_KEY`, `MAILGUN_FROM` | Mailgun credentials for transactional emails. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | SendGrid credentials for automated notifications. |
| `OPENWEATHERMAP_API_KEY` | Weather data source API key. |

> Tip: Use `.env.local` or `.env` to store secrets. The included `start-database.sh` script can generate a secure Postgres password and update `DATABASE_URL` automatically.

## Local Development
1. **Prerequisites**
   - Node.js 20+
   - pnpm 9+
   - Docker (for local Postgres)
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Configure environment**
   - Copy `.env` or `.env.example` (if present) and populate required variables.
   - Run `./start-database.sh` to provision the Postgres container.
4. **Database setup**
   ```bash
   pnpm prisma migrate deploy
   pnpm db:seed
   ```
5. **Run the app**
   ```bash
   pnpm dev
   ```
   The app runs on [http://localhost:3005](http://localhost:3005) with Turbopack enabled.

## Quality & Tooling
- **Linting**: `pnpm lint`
- **Formatting**: Prettier 3 with Tailwind plugin (auto-sorted classes). Prettier config lives in `.prettierrc`.
- **Type Safety**: TypeScript strict mode; generated Prisma types in `src/prisma/generated`.
- **Testing**: Automated tests are not yet configured. Follow manual QA guidelines (lint + feature verification) documented in `AGENTS.md`.

## Deployment Notes
- Builds with `pnpm build` and serves via `pnpm start`.
- Ensure production `DATABASE_URL` and OAuth credentials point to live services.
- Configure `NEXTAUTH_URL` to the deployed origin before enabling OAuth providers.
- Long-running analytics ingestion and third-party sync jobs are handled outside this repo; confirm they are connected before promoting to production.

## Additional Resources
- `AGENTS.md` — contributor guidelines and workflow expectations.
- `email-channel-api-spec.md`, `paid-search-channel-api-spec.md`, `paid-social-channel-api-spec.md` — API contracts for marketing integrations.
- `prisma/sample_data/` — example payloads useful while developing analytics views.
- `scripts/` — utility scripts for data hygiene.
