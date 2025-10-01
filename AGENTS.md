# Repository Guidelines

## Project Structure & Module Organization
Application code is rooted in `src/`. `src/app` hosts Next.js App Router segments and server actions. Shared UI lives under `src/components`, while data hooks and client logic belong in `src/hooks`, `src/lib`, `src/stores`, and `src/providers`. Prisma helpers sit in `src/prisma`; generated schema, migrations, and seeds reside in `prisma/`. Static assets are stored in `public/`, and utility scripts (cleanup jobs, etc.) live in `scripts/`. Run `start-database.sh` to spin up the local Postgres container defined in `.env`.

## Build, Test, and Development Commands
Use pnpm for consistency. `pnpm dev` launches the app on port 3005 with Turbopack. `pnpm build` produces the optimized production bundle, and `pnpm start` serves that build. `pnpm lint` runs the Next.js ESLint suite. `pnpm db:seed` executes `prisma/seed.ts` against the `DATABASE_URL`.

## Coding Style & Naming Conventions
We rely on TypeScript throughout. Follow Prettier 3 defaults with the Tailwind plugin—classes are auto-sorted and formatting uses two-space indentation and double quotes. ESLint (config in `eslint.config.mjs`) enforces Next.js and React best practices; resolve warnings before sending a PR. Use descriptive PascalCase for components, camelCase for hooks/utilities, and kebab-case for file names except React components (`FeatureCard.tsx`). Keep Tailwind classes organized from layout → spacing → color to align with utility merging.

## Testing Guidelines
Automated tests are not yet part of the toolchain. Until a framework is adopted, rely on `pnpm lint` plus targeted manual verification of affected flows. When you introduce a test suite, collocate files as `*.test.tsx` or `*.spec.ts` near the module and ensure commands integrate with CI before committing. Document any new testing commands in this guide.

## Commit & Pull Request Guidelines
Commit messages in this repo use concise, sentence-style summaries (see `git log` for examples such as “resolve build error”). Keep subjects under ~72 characters and focus on the observable change. Each PR should include: overview of the change, testing notes (manual steps or scripts run), linked Linear/Jira issue if applicable, and screenshots for UI updates. Request review whenever behavior changes or schema migrations are involved.

## Domain Overview
- The product serves three roles: `ADMIN`, `ACCOUNT_REP`, and `CLIENT`. Each role has a dedicated dashboard plus shared chat, analytics, reports, and ticketing surfaces.
- Companies are first-class records; onboarding (`/onboarding/step1`) and user creation flows now use a reusable company selector that can search or create records via `/api/companies` and store the resulting `companyId` on the user.
- Conversations and reports are LLM-backed. `/api/llm/*` routes proxy an external LLM service (`LLM_SERVICE_URL`) and rely on Upstash rate limiting to protect the upstream.
- Analytics data is sourced from Google Analytics, Sprout Social, email clients, and USPS direct mail integrations mapped in the Prisma schema. Seed data in `prisma/seed.ts` helps local development.
- Ticketing, messaging, and notifications are shared modules accessed through role-specific route groups inside `src/app`.

## Environment & Tooling Notes
- Local development assumes PostgreSQL. Run `./start-database.sh` to provision Docker-based Postgres using credentials from `.env`; the script can rotate the password automatically.
- Required secrets include OAuth keys (Google/Azure), `DATABASE_URL`, `LLM_SERVICE_URL`, `MAILGUN_API_KEY`, `SENDGRID_API_KEY`, and `OPENWEATHERMAP_API_KEY`. Public URLs (`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`) are used when generating links in emails.
- The dev server runs on port `3005` with Turbopack (`pnpm dev`). Use `pnpm prisma migrate deploy` followed by `pnpm db:seed` after pulling new migrations.
- Email notifications use SendGrid (`src/lib/email.ts`) while password reset flows use Mailgun (`/api/mailgun`). Keep both providers configured in non-production environments if you rely on those flows.
