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
